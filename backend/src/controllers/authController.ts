import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      res.status(500).json({ message: 'Database error', error: checkError.message });
      return;
    }

    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from(TABLES.USERS)
      .insert([{ email, password: hashedPassword, name }])
      .select('id, email, name, created_at')
      .single();

    if (insertError) {
      res.status(500).json({ message: 'Failed to create user', error: insertError.message });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user
    const { data: user, error: findError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError || !user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token to karuna_refresh_tokens
    const { error: tokenInsertError } = await supabase
      .from(TABLES.REFRESH_TOKENS)
      .insert([
        {
          user_id: user.id,
          token: refreshToken,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (tokenInsertError) {
      res.status(500).json({ message: 'Failed to save refresh token', error: tokenInsertError.message });
      return;
    }

    // Set HttpOnly Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token is missing' });
      return;
    }

    // Verify refresh token JWT
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(403).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // Check token in database
    const { data: storedToken, error: tokenQueryError } = await supabase
      .from(TABLES.REFRESH_TOKENS)
      .select('*')
      .eq('token', refreshToken)
      .maybeSingle();

    if (tokenQueryError || !storedToken) {
      res.status(403).json({ message: 'Refresh token not recognized' });
      return;
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      res.status(403).json({ message: 'Refresh token has expired' });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Remove from database
      await supabase
        .from(TABLES.REFRESH_TOKENS)
        .delete()
        .eq('token', refreshToken);
    }

    // Clear HttpOnly Cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
