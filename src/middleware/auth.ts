import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

interface JwtPayload {
  userId: string;
  email: string;
}

// ✅ Definimos el tipo para que coincida exactamente con los valores que asignamos
declare module 'next' {
  interface NextApiRequest {
    user: {
      userId: string;
      email: string;
      role: string; // ✅ Obligatorio, no undefined
      organizationId: string; // ✅ Obligatorio, no undefined
    };
  }
}

export const withAuth = (handler: NextApiHandler, rolesPermitidos?: string[]) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const encabezado = req.headers.authorization;
    if (!encabezado || !encabezado.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token faltante o inválido' });
    }

    const token = encabezado.split(' ')[1];
    try {
      const datosToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const usuario = await prisma.user.findUnique({
        where: { id: datosToken.userId },
        include: {
          userRoles: {
            include: { role: true, organization: true }
          }
        }
      });

      if (!usuario || usuario.status !== 'activo') {
        return res.status(401).json({ mensaje: 'Usuario no encontrado o inactivo' });
      }

      const primerRol = usuario.userRoles[0];
      if (!primerRol || !primerRol.role.code || !primerRol.organizationId) {
        return res.status(403).json({ mensaje: 'Faltan datos de rol u organización' });
      }

      // ✅ Asignamos valores 100% seguros, sin null/undefined
      req.user = {
        userId: usuario.id,
        email: usuario.email,
        role: primerRol.role.code,
        organizationId: primerRol.organizationId
      };

      // ✅ Validación de roles sin errores
      if (rolesPermitidos && rolesPermitidos.length > 0) {
        if (!rolesPermitidos.includes(req.user.role)) {
          return res.status(403).json({ mensaje: 'No tienes permisos para esta acción' });
        }
      }

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
  };
};