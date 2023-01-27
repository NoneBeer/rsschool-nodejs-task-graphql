import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { MemberTypeId } from '../../utils/constants';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memeberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id });
      if (!memeberType)
        throw reply.notFound();
      return memeberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      if (!(request.params.id in MemberTypeId)) throw reply.badRequest();
      const memeberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id });
      if (!memeberType)
        throw reply.badRequest();
      return await fastify.db.memberTypes.change(request.params.id, request.body);
    }
  );
};

export default plugin;
