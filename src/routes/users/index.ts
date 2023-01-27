import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { isUUID } from '../../utils/isUUID';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
      if (!user)
        throw reply.notFound();
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return await fastify.db.users.create(request.body);;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();
      const user = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
      if (!user)
        throw reply.notFound();

      const userPosts = await fastify.db.posts.findMany({ key: 'userId', equals: user.id });
      userPosts.forEach(post => {
        fastify.db.posts.delete(post.id);
      })

      const userProfile = await fastify.db.profiles.findOne({ key: 'userId', equals: user.id });
      await fastify.db.profiles.delete(userProfile!.id);

      const subscribedUsers = await fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: user.id });
      subscribedUsers.forEach(async (subUser) => {
        const updatedUser = subUser;
        const index = user.subscribedToUserIds.indexOf(user.id);
        updatedUser.subscribedToUserIds.splice(index, 1);
        await fastify.db.users.change(subUser.id, updatedUser);
      })
      
      return await fastify.db.users.delete(user.id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();
      if (!isUUID(request.body.userId))
        throw reply.badRequest();

      const userWhoSubscribes = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
      const subscribedUser = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });

      if (!userWhoSubscribes || !subscribedUser)
        throw reply.notFound();
      subscribedUser.subscribedToUserIds.push(userWhoSubscribes.id);
      return await fastify.db.users.change(subscribedUser.id, subscribedUser);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();
      if (!isUUID(request.body.userId))
        throw reply.badRequest();

      const userWhoUnsubscribe = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
      const unsubscribedUser = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });

      if (!userWhoUnsubscribe || !unsubscribedUser)
        throw reply.notFound();

      const index = unsubscribedUser.subscribedToUserIds.indexOf(userWhoUnsubscribe.id);
      if (index === -1)
        throw reply.badRequest();

      unsubscribedUser.subscribedToUserIds.splice(index, 1);
      return await fastify.db.users.change(unsubscribedUser.id, unsubscribedUser)

    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (!isUUID(request.params.id))
        throw reply.badRequest();

      const user = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });

      if (!user)
        throw reply.notFound();
      return await fastify.db.users.change(user.id, request.body);
    }
  );
};

export default plugin;
