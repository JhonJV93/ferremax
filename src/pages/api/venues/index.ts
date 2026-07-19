import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@/lib/cache';
import { withAuth } from '@/middleware/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const orgId = req.user.organizationId;
  if (!orgId) {
    return res.status(400).json({ mensaje: 'No se identificó la organización del usuario' });
  }

  // Parámetros de paginación
  const { page = '1', limit = '20' } = req.query;
  const pagina = Math.max(1, Number(page));
  const limite = Math.min(50, Number(limit));
  const CACHE_KEY = `venues:org:${orgId}:pagina:${pagina}:limite:${limite}`;

  // 1. Revisa caché primero
  const datosEnCache = getCache(CACHE_KEY);
  if (datosEnCache) {
    return res.status(200).json({
      ...datosEnCache,
      fuente: 'caché'
    });
  }

  // 2. Consulta base de datos (sin N+1)
  const [totalRegistros, sucursales] = await Promise.all([
    prisma.venue.count({ where: { organizationId: orgId } }),
    prisma.venue.findMany({
      where: { organizationId: orgId },
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true }
        }
      }
    })
  ]);

  // 3. Prepara respuesta y guarda en caché
  const respuesta = {
    total: totalRegistros,
    pagina,
    limite,
    totalPaginas: Math.ceil(totalRegistros / limite),
    sucursales,
    fuente: 'base de datos'
  };

  setCache(CACHE_KEY, respuesta, true);
  return res.status(200).json(respuesta);
};

// ✅ Valida token y permite SOLO el rol superadmin
export default withAuth(handler, ['superadmin']);