// src/lib/db/index.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Permission } from './entities/Permission';
import { Movie } from './entities/Movie';
import { Category } from './entities/Category';
import { Actor } from './entities/Actor';
import { Country } from './entities/Country';
import { Theme } from './entities/Theme';
import { Comment } from './entities/Comment';
import { Rating } from './entities/Rating';
import { Favorite } from './entities/Favorite';
import { Episode } from './entities/Episode';
import { View } from './entities/View';
import { Collection } from './entities/Collection';
import { Director } from './entities/Director';
import { Genre } from './entities/Genre';
import { Review } from './entities/Review';
import { SlugConfig } from './entities/SlugConfig';
import { ValidateMovie } from './entities/ValidateMovie';

const databaseSetups: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'rophim',
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create database schema in development
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    Actor,
    Category,
    Collection,
    Comment,
    Country,
    Director,
    Episode,
    Favorite,
    Genre,
    Movie,
    Permission,
    Rating,
    Review,
    Role,
    SlugConfig,
    Theme,
    User,
    ValidateMovie,
    View,
  ],
  migrations: [],
  subscribers: [],
};

// Initialize data source
export const AppDataSource = new DataSource(databaseSetups);

// Database connection singleton
let initialized = false;

export async function getDbConnection() {
  if (!initialized) {
    try {
      await AppDataSource.initialize();
      console.log('Database connection established');
      initialized = true;
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }
  return AppDataSource;
}

// Repository getters
export const getUserRepository = async () => (await getDbConnection()).getRepository(User);
export const getRoleRepository = async () => (await getDbConnection()).getRepository(Role);
export const getPermissionRepository = async () =>
  (await getDbConnection()).getRepository(Permission);
export const getMovieRepository = async () => (await getDbConnection()).getRepository(Movie);
export const getCategoryRepository = async () => (await getDbConnection()).getRepository(Category);
export const getActorRepository = async () => (await getDbConnection()).getRepository(Actor);
export const getCountryRepository = async () => (await getDbConnection()).getRepository(Country);
export const getThemeRepository = async () => (await getDbConnection()).getRepository(Theme);
export const getCommentRepository = async () => (await getDbConnection()).getRepository(Comment);
export const getRatingRepository = async () => (await getDbConnection()).getRepository(Rating);
export const getFavoriteRepository = async () => (await getDbConnection()).getRepository(Favorite);
export const getEpisodeRepository = async () => (await getDbConnection()).getRepository(Episode);
export const getViewRepository = async () => (await getDbConnection()).getRepository(View);
