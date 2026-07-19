import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ Importante: desactiva el analizador de cuerpo predeterminado de Next.js para leer JSON correctamente
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ exito: false, mensaje: 'Método no permitido' });

  // ✅ Lee el cuerpo que enviaste en Postman
  const { email, password } = req.body;
  console.log('Cuerpo recibido:', req.body); // Para depurar

  if (!email || !password) {
    return res.status(400).json({ exito: false, mensaje: 'Correo y contraseña son obligatorios' });
  }

  // Busca el usuario en la base de datos
  const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario || usuario.status !== 'activo') {
    return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
  }

  // Verifica la contraseña
  const contraseñaValida = await bcrypt.compare(password, usuario.passwordHash || '');
  if (!contraseñaValida) {
    return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
  }

  // Genera el token JWT
  const token = jwt.sign(
    {
      userId: usuario.id,
      email: usuario.email,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  return res.status(200).json({
    exito: true,
    mensaje: 'Inicio de sesión exitoso',
    accessToken: token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
    }
  });
}