// src/lib/db/setup.ts
import { AppDataSource, getDbConnection } from './index';
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Permission } from './entities/Permission';
import { Movie } from './entities/Movie';
import { Category } from './entities/Category';
import { Actor } from './entities/Actor';
import { Country } from './entities/Country';
import { Theme } from './entities/Theme';
import { hashPassword } from '../auth';

async function setupDatabase() {
  try {
    // Initialize database connection
    await getDbConnection();

    // Create default permissions
    const permissions = [
      { name: 'view_movies', description: 'Can view movies' },
      { name: 'create_movies', description: 'Can create movies' },
      { name: 'edit_movies', description: 'Can edit movies' },
      { name: 'delete_movies', description: 'Can delete movies' },
      { name: 'manage_users', description: 'Can manage users' },
      { name: 'manage_roles', description: 'Can manage roles' },
    ];

    for (const perm of permissions) {
      const existingPerm = await AppDataSource.getRepository(Permission).findOne({
        where: { name: perm.name },
      });

      if (!existingPerm) {
        await AppDataSource.getRepository(Permission).save(perm);
        console.log(`Created permission: ${perm.name}`);
      }
    }

    // Create default roles
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permissions: [
          'view_movies',
          'create_movies',
          'edit_movies',
          'delete_movies',
          'manage_users',
          'manage_roles',
        ],
      },
      {
        name: 'editor',
        description: 'Content editor',
        permissions: ['view_movies', 'create_movies', 'edit_movies'],
      },
      {
        name: 'user',
        description: 'Regular user',
        permissions: ['view_movies'],
      },
    ];

    for (const roleData of roles) {
      const existingRole = await AppDataSource.getRepository(Role).findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        // Get permission entities
        const permEntities = await AppDataSource.getRepository(Permission).find({
          where: roleData.permissions.map((name) => ({ name })),
        });

        const role = new Role();
        role.name = roleData.name;
        role.description = roleData.description;
        role.permissions = permEntities;

        await AppDataSource.getRepository(Role).save(role);
        console.log(`Created role: ${role.name}`);
      }
    }

    // Create default admin user
    const adminEmail = 'admin@example.com';
    const existingAdmin = await AppDataSource.getRepository(User).findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const adminRole = await AppDataSource.getRepository(Role).findOne({
        where: { name: 'admin' },
        relations: ['permissions'],
      });

      if (adminRole) {
        const admin = new User();
        admin.email = adminEmail;
        admin.name = 'Admin User';
        admin.passwordHash = await hashPassword('admin123');
        admin.roles = [adminRole];

        await AppDataSource.getRepository(User).save(admin);
        console.log('Created admin user');
      }
    }

    // Create default categories
    const categories = [
      { name: 'Hành Động', slug: 'hanh-dong', description: 'Phim hành động' },
      { name: 'Chiếu Rạp', slug: 'chieu-rap', description: 'Phim chiếu rạp' },
      { name: 'Gay Cấn', slug: 'gay-can', description: 'Phim gay cấn' },
      { name: 'Hình Sự', slug: 'hinh-su', description: 'Phim hình sự' },
    ];

    for (const cat of categories) {
      const existingCat = await AppDataSource.getRepository(Category).findOne({
        where: { slug: cat.slug },
      });

      if (!existingCat) {
        await AppDataSource.getRepository(Category).save(cat);
        console.log(`Created category: ${cat.name}`);
      }
    }

    // Create default countries
    const countries = [
      { name: 'Việt Nam', slug: 'viet-nam' },
      { name: 'Hàn Quốc', slug: 'han-quoc' },
      { name: 'Trung Quốc', slug: 'trung-quoc' },
      { name: 'Mỹ', slug: 'my' },
      { name: 'Anh', slug: 'anh' },
    ];

    for (const country of countries) {
      const existingCountry = await AppDataSource.getRepository(Country).findOne({
        where: { slug: country.slug },
      });

      if (!existingCountry) {
        await AppDataSource.getRepository(Country).save(country);
        console.log(`Created country: ${country.name}`);
      }
    }

    // Create default themes
    const themes = [
      { name: 'Marvel', slug: 'marvel', description: 'Phim Marvel' },
      { name: '4K', slug: '4k', description: 'Phim chất lượng 4K' },
      { name: 'Sitcom', slug: 'sitcom', description: 'Phim hài tình huống' },
      {
        name: 'Lồng Tiếng Cực Mạnh',
        slug: 'long-tieng-cuc-manh',
        description: 'Phim lồng tiếng Việt',
      },
      { name: 'Xuyên Không', slug: 'xuyen-khong', description: 'Phim xuyên không' },
      { name: 'Cổ Trang', slug: 'co-trang', description: 'Phim cổ trang' },
    ];

    for (const theme of themes) {
      const existingTheme = await AppDataSource.getRepository(Theme).findOne({
        where: { slug: theme.slug },
      });

      if (!existingTheme) {
        await AppDataSource.getRepository(Theme).save(theme);
        console.log(`Created theme: ${theme.name}`);
      }
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Run the setup
setupDatabase();
