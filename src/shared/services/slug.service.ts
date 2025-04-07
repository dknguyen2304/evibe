import { Repository } from 'typeorm';
import { SlugConfig } from '@/lib/db/entities/SlugConfig';
import slugify from 'slugify';

export class SlugService {
  constructor(private slugConfigRepository: Repository<SlugConfig>) {}

  async generateSlug(entityType: string, entityData: any): Promise<string> {
    // Lấy cấu hình slug hiện tại cho loại thực thể
    const config = await this.slugConfigRepository.findOne({
      where: { entityType, isActive: true },
    });

    if (!config) {
      // Sử dụng cấu hình mặc định nếu không tìm thấy cấu hình
      return this.generateDefaultSlug(entityData.title || entityData.name);
    }

    // Xử lý mẫu slug
    let slug = this.processSlugPattern(config.pattern, entityData);

    // Áp dụng các tùy chọn slugify
    const options = config.options || {};
    slug = slugify(slug, {
      lower: options.lowercase !== false,
      strict: options.strict !== false,
      replacement: options.separator || '-',
      ...options,
    });

    // Cắt bớt slug nếu cần
    if (options.maxLength && slug.length > options.maxLength) {
      slug = slug.substring(0, options.maxLength);
    }

    // Loại bỏ các từ dừng nếu được cấu hình
    if (options.removeStopWords && options.stopWords?.length) {
      for (const word of options.stopWords) {
        const regex = new RegExp(`-${word}-`, 'g');
        slug = slug.replace(regex, '-');
      }
      // Xử lý trường hợp từ dừng ở đầu hoặc cuối
      slug = slug.replace(/^-+|-+$/g, '');
    }

    return slug;
  }

  private processSlugPattern(pattern: string, data: any): string {
    // Thay thế các biến trong mẫu bằng dữ liệu thực tế
    return pattern.replace(/{([^}]+)}/g, (match, key) => {
      const value = this.getNestedProperty(data, key);
      return value !== undefined ? String(value) : '';
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }

  private generateDefaultSlug(text: string): string {
    return slugify(text || '', { lower: true, strict: true });
  }

  async regenerateAllSlugs(entityType: string, repository: Repository<any>): Promise<void> {
    // Lấy tất cả các thực thể của loại đã chỉ định
    const entities = await repository.find();

    // Tạo lại slug cho từng thực thể
    for (const entity of entities) {
      const newSlug = await this.generateSlug(entityType, entity);

      // Đảm bảo slug là duy nhất
      const uniqueSlug = await this.ensureUniqueSlug(newSlug, entityType, entity.id, repository);

      // Cập nhật slug
      entity.slug = uniqueSlug;
      await repository.save(entity);
    }
  }

  async ensureUniqueSlug(
    baseSlug: string,
    entityType: string,
    entityId: number,
    repository: Repository<any>,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      // Kiểm tra xem slug đã tồn tại chưa
      const existingEntity = await repository.findOne({
        where: { slug },
      });

      // Nếu không tồn tại hoặc là chính thực thể này, thì slug là duy nhất
      if (!existingEntity || existingEntity.id === entityId) {
        slugExists = false;
      } else {
        // Nếu slug đã tồn tại, thêm số đếm và thử lại
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  }
}
