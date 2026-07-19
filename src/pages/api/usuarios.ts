import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(usuarios);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ message: 'Método no permitido' });
}