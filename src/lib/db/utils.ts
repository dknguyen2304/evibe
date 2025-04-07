import { getDbConnection } from '.';
import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

export async function getRepo<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
): Promise<Repository<T>> {
  const ds = await getDbConnection();
  return ds.getRepository(entity);
}
