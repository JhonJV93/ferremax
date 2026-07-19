import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@/lib/cache';
import { withAuth } from '@/middleware/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') return res.status(405).json({ mensaje: 'Método no permitido' });

  const { page = 1, limit = 20 } = req.query;
  const pagina = Math.max(1, Number(page));
  const limite = Math.min(50, Number(limit));
  const CACHE_KEY = `roles:page:${pagina}:limit:${limite}`;

  // ✅ Caché Cache-Aside: primero buscamos en memoria
  const datosCache = getCache(CACHE_KEY);
  if (datosCache) return res.status(200).json({ ...datosCache, fuente: 'caché' });

  // ✅ Corrección N+1: traemos rol y organización en UNA SOLA consulta
  const [total, registros] = await Promise.all([
    prisma.role.count(),
    prisma.role.findMany({
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        code: true,
        name: true,
        isSystem: true,
        createdAt: true,
        // ✅ Eager Loading: cargamos relación obligatoria sin consultas extra
        organization: { select: { id: true, name: true } }
      }
    })
  ]);

  const respuesta = {
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
    datos: registros,
    fuente: 'base de datos'
  };

  // Guardamos en caché por 5 minutos (datos estáticos)
  setCache(CACHE_KEY, respuesta, true);
  return res.status(200).json(respuesta);
};

export default withAuth(handler, ['superadmin']);