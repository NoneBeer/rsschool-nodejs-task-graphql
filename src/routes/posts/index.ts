import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { isUUID } from '../../utils/isUUID';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (!post)
        throw reply.notFound();
      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return await fastify.db.posts.create(request.body);;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();

      const post = await fastify.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (!post)
        throw reply.notFound();
        
      return await fastify.db.posts.delete(request.params.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();

      const post = await fastify.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (!post)
        throw reply.notFound();

      return await fastify.db.posts.change(request.params.id, request.body);
    }
  );
};

export default plugin;
