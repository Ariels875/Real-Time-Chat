import { db } from './index.js';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export class UserHandle {
  static async create(username, password) {
    Validation.username(username);
    Validation.password(password);

    const user = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    if (user.rows.length > 0) throw new Error('Username already exists');
    const id = crypto.randomUUID();

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute({
      sql: 'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      args: [id, username, hashedPassword]
    });

    return id;
  }

  static async login(username, password) {
    Validation.username(username);
    Validation.password(password);

    const user = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    if (user.rows.length === 0) throw new Error('User does not exist');

    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) throw new Error('Invalid password');

    const { password: _, ...publicUser } = user.rows[0];

    return publicUser;
  }
}

class Validation {
  static username(username) {
    if (typeof username !== 'string') throw new Error('Username must be a string');
    if (username.length < 3) throw new Error('Username must be at least 3 characters long');
    if (!/^[a-zA-Z0-9]+$/.test(username)) throw new Error('Username can only contain letters and numbers');
  }

  static password(password) {
    if (typeof password !== 'string') throw new Error('Password must be a string');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long');
  }
}

export default UserHandle;
