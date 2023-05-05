import { createSchema } from 'graphql-yoga'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from './context'
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import { decodedToken } from './decodedToken';



export const typeDefs = `
  type Mutation {
    createMovie(authorEmail: String!, data: MovieCreateInput!): Movie
    deleteMovie(id: Int!): Movie
    signupUser(data: UserCreateInput!): User!
    loginUser(data:LoginInput!):LoginToken!
  }

  type Movie {
    author: User
    content: String
    createdAt: DateTime!
    id: Int!
    title: String!
    updatedAt: DateTime!
  }

  input MovieCreateInput {
    content: String
    title: String!
  }

  input LoginInput{
    email: String
    password: String
  }

  
  type LoginToken{
    token: String
  }


  type Query {
    allUsers: [User!]!
    users:User
    moviesByUser(userUniqueInput: UserUniqueInput!): [Movie]
    movieById(id: Int): Movie
  }

  enum SortOrder {
    asc
    desc
  }

  type User {
    email: String!
    id: Int!
    token: String
    name: String
    password: String
    movies: [Movie!]
  }

  input UserCreateInput {
    email: String!
    password: String!
    name: String
    movies: [MovieCreateInput!]
  }

  input UserUniqueInput {
    email: String
    id: Int
  }

  scalar DateTime
`

export const resolvers = {
  Query: {
    allUsers: (_parent, _args, context: Context) => {
      // const decoded = decodedToken(_args);
      console.log(_args)
      return context.prisma.user.findMany()
    },
    movieById: (_parent, args: { id: number }, context: Context) => {
      return context.prisma.movie.findUnique({
        where: { id: args.id || undefined },
      })
    },
    moviesByUser: (
      _parent,
      args: { userUniqueInput: UserUniqueInput },
      context: Context,
    ) => {
      return context.prisma.user
        .findUnique({
          where: {
            id: args.userUniqueInput.id || undefined,
            email: args.userUniqueInput.email || undefined,
          },
        })
        .movies()
    },
  },
  Mutation: {
    signupUser: async (
      _parent: any,
      args: { data: UserCreateInput },
      context: Context,
    ) => {
      try {
        let newUser = await context.prisma.user.create({
          data: {
            name: args.data.name,
            email: args.data.email,
            password: bcrypt.hashSync(args.data.password, 3)
          },
        });
        return { ...newUser, token: jwt.sign(newUser, "279035e2ae72667c77de2f6e0ad13887") };
      } catch (err) {
        console.log(err, "..")
        throw new Error(
          `User with ID ${args.data.email} already exist in the database.`,
        )
      }
    },

    loginUser: async (
      _parent: any,
      args: { data: LoginInput },
      context: Context,
    ) => {
      let theUser = await context.prisma.user.findUnique({
        where: { email: args.data.email },
      })
      if (!theUser) throw new Error('Unable to Login');
      const isMatch = bcrypt.compareSync(args.data.password, theUser.password);
      if (!isMatch) throw new Error('Unable to Login');
      return { token: jwt.sign(theUser, "279035e2ae72667c77de2f6e0ad13887") };

    },


    createMovie: (
      _parent: any,
      args: { data: MovieCreateInput; authorEmail: string },
      context: Context,
    ) => {
      return context.prisma.movie.create({
        data: {
          title: args.data.title,
          content: args.data.content,
          author: {
            connect: { email: args.authorEmail },
          },
        },
      })
    },
   
    deleteMovie: (_parent, args: { id: number }, context: Context) => {
      return context.prisma.movie.delete({
        where: { id: args.id },
      })
    },
  },
  DateTime: DateTimeResolver,
  Movie: {
    author: (parent, _args, context: Context) => {
      return context.prisma.movie
        .findUnique({
          where: { id: parent?.id },
        })
        .author()
    },
  },
  User: {
    movies: (parent, _args, context: Context) => {
      return context.prisma.user
        .findUnique({
          where: { id: parent?.id },
        }).movies();

    },
  },
}


interface UserUniqueInput {
  id?: number
  email?: string
}

interface MovieCreateInput {
  title: string
  content?: string
}

interface UserCreateInput {
  password: string
  email: string
  name?: string
  movies?: MovieCreateInput[]
}

interface LoginInput {
  email?: string,
  password?: string
}

export const schema = createSchema({
  typeDefs,
  resolvers,
})