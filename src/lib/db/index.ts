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
    User,
    Role,
    Permission,
    Movie,
    Category,
    Actor,
    Country,
    Theme,
    Comment,
    Rating,
    Favorite,
    Episode,
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
export const getUserRepository = () => AppDataSource.getRepository(User);
export const getRoleRepository = () => AppDataSource.getRepository(Role);
export const getPermissionRepository = () => AppDataSource.getRepository(Permission);
export const getMovieRepository = () => AppDataSource.getRepository(Movie);
export const getCategoryRepository = () => AppDataSource.getRepository(Category);
export const getActorRepository = () => AppDataSource.getRepository(Actor);
export const getCountryRepository = () => AppDataSource.getRepository(Country);
export const getThemeRepository = () => AppDataSource.getRepository(Theme);
export const getCommentRepository = () => AppDataSource.getRepository(Comment);
export const getRatingRepository = () => AppDataSource.getRepository(Rating);
export const getFavoriteRepository = () => AppDataSource.getRepository(Favorite);
export const getEpisodeRepository = () => AppDataSource.getRepository(Episode);
export const getViewRepository = () => AppDataSource.getRepository(View);
