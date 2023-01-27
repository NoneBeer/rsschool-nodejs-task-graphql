import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { isUUID } from '../../utils/isUUID';
import { MemberTypeId } from '../../utils/constants';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return await fastify.db.profiles.findMany();;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (!profile)
        throw reply.notFound();
        
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (!(request.body.memberTypeId in MemberTypeId))
        throw reply.badRequest();

      const user = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });

      if (!user)
        throw reply.notFound();

      const existProfile = await fastify.db.profiles.findOne({ key: 'userId', equals: request.body.userId });
      if (existProfile)
        throw reply.badRequest();

      return await fastify.db.profiles.create(request.body);;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id });

      if (!profile)
        throw reply.notFound();

      return await fastify.db.profiles.delete(profile.id);;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id });

      if (!profile)
        throw reply.notFound();

      return await fastify.db.profiles.change(profile.id, request.body);
    }
  );
};

export default plugin;
