import 'server-only';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/server/repositories/user.repository';
export const userService = {
  async register(email: string, password: string) {
    if (await userRepository.findByEmail(email)) {
      throw new Error('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return userRepository.create(email, passwordHash);
  },
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid email or password');
    }
    return user;
  },
};
