import type { LexicalBlockSpec } from '../lib/lexical';

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  imageKey: 'cups' | 'containers' | 'bottles' | 'bags';
  seoTitle: string;
  seoDescription: string;
}

export interface SeedProduct {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  shortDescription: string;
  blocks: LexicalBlockSpec[];
  imageKey: 'cups' | 'containers' | 'bottles' | 'bags';
  specs: Array<{ label: string; value: string }>;
  packagingSpec: string;
  minOrderQty: number;
  minOrderUnit: string;
  price?: number;
  showPrice: boolean;
  featured: boolean;
  status: 'published' | 'draft';
  relatedSlugs?: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface SeedPostCategory {
  name: string;
  slug: string;
  description: string;
}

export interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  authorName: string;
  publishedAt: string;
  imageKey: 'blog' | 'cups' | 'containers' | 'bags';
  blocks: LexicalBlockSpec[];
  relatedProductSlugs: string[];
  status: 'published' | 'draft';
  seoTitle: string;
  seoDescription: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Ly & Cốc Dùng Một Lần',
    slug: 'ly-coc-dung-mot-lan',
    description:
      'Dữ liệu minh họa: Các dòng ly nhựa PET, ly nhựa PP chịu nhiệt, ly giấy kraft 1-2 lớp và nắp cầu/nắp bằng dùng cho quán cà phê, trà sữa và chuỗi đồ uống.',
    displayOrder: 1,
    imageKey: 'cups',
    seoTitle: 'Ly & Cốc Dùng Một Lần Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Tổng hợp các mẫu ly nhựa PET, PP và ly giấy dùng một lần giá sỉ theo thùng, đa dạng dung tích từ 360ml đến 700ml (dữ liệu minh họa).',
  },
  {
    name: 'Hộp & Khay Thực Phẩm',
    slug: 'hop-khay-thuc-pham',
    description:
      'Dữ liệu minh họa: Hộp nhựa PP chữ nhật dùng được lò vi sóng, hộp cơm nhiều ngăn và tô giấy kraft kèm nắp trong suốt cho mô hình giao món mang đi.',
    displayOrder: 2,
    imageKey: 'containers',
    seoTitle: 'Hộp & Khay Thực Phẩm Mang Đi Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Cung cấp sỉ hộp nhựa PP, hộp cơm bento 3-4 ngăn và tô giấy kraft đựng salad, bún phở mang về (dữ liệu minh họa).',
  },
  {
    name: 'Chai & Hũ Nhựa PET',
    slug: 'chai-hu-nhua-pet',
    description:
      'Dữ liệu minh họa: Chai nhựa PET trong suốt kèm nắp niêm phong, hũ PET nắp nhôm và nắp nhựa miệng rộng đựng nước ép, trà sữa và thực phẩm khô.',
    displayOrder: 3,
    imageKey: 'bottles',
    seoTitle: 'Chai & Hũ Nhựa PET Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Chai PET tròn, vuông và hũ nhựa PET nắp vặn nhôm chuyên dụng cho đồ uống đóng chai và hạt khô (dữ liệu minh họa).',
  },
  {
    name: 'Túi & Bao Bì Giấy',
    slug: 'tui-bao-bi-giay',
    description:
      'Dữ liệu minh họa: Túi giấy kraft quai xoắn, giấy gói thực phẩm chống thấm dầu và túi HDPE/PE đựng ly, hộp mang đi cho cửa hàng F&B.',
    displayOrder: 4,
    imageKey: 'bags',
    seoTitle: 'Túi Đóng Gói & Bao Bì Giấy Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Đặt sỉ túi giấy kraft có quai, giấy gói bánh chống dầu và túi xốp HDPE nhiều kích thước (dữ liệu minh họa).',
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: 'Ly Nhựa PET 500ml Nắp Cầu (Minh họa)',
    slug: 'ly-nhua-pet-500ml-nap-cau',
    sku: 'AP-LY-PET500',
    categorySlug: 'ly-coc-dung-mot-lan',
    shortDescription:
      'Sản phẩm minh họa: Ly nhựa PET nguyên sinh độ trong cao, miệng 93mm phù hợp đồ uống lạnh, trà sữa, cà phê đá.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Đặc điểm nổi bật (Nội dung minh họa)' },
      {
        kind: 'paragraph',
        text: 'Sản phẩm ly PET 500ml được sản xuất từ hạt nhựa nguyên sinh an toàn thực phẩm, thành ly cứng cáp, bề mặt bóng trong giúp tôn màu thức uống.',
      },
      {
        kind: 'list',
        listType: 'bullet',
        items: [
          'Tương thích nắp cầu và nắp bằng đường kính Ø93mm.',
          'Phù hợp đồ uống lạnh, sinh tố, đá xay và trà trái cây.',
          'Đóng lốc 50 cái bọc nilon sạch sẽ, dễ bảo quản tại kho.',
        ],
      },
    ],
    imageKey: 'cups',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa PET nguyên sinh' },
      { label: 'Dung tích', value: '500 ml (16 oz)' },
      { label: 'Đường kính miệng', value: '93 mm' },
      { label: 'Nhiệt độ khuyến nghị', value: '0°C – 45°C (Đồ uống lạnh)' },
    ],
    packagingSpec: '1.000 cái / thùng (20 lốc x 50 cái)',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    price: 540000,
    showPrice: true,
    featured: true,
    status: 'published',
    relatedSlugs: ['ly-nhua-pp-700ml-ep-mang', 'ly-giay-kraft-2-lop-360ml'],
    seoTitle: 'Ly Nhựa PET 500ml Nắp Cầu Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Ly nhựa PET 500ml miệng 93mm trong suốt, đóng thùng 1.000 cái, hỗ trợ báo giá sỉ cho quán cà phê (dữ liệu minh họa).',
  },
  {
    name: 'Ly Nhựa PP 700ml Ép Màng Nhiệt (Minh họa)',
    slug: 'ly-nhua-pp-700ml-ep-mang',
    sku: 'AP-LY-PP700',
    categorySlug: 'ly-coc-dung-mot-lan',
    shortDescription:
      'Sản phẩm minh họa: Ly PP đáy bầu hoặc đáy bằng dung tích lớn 700ml, chịu nhiệt tốt và ép được màng seal miệng 95mm.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Ứng dụng cho chuỗi trà sữa (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Dòng ly PP 700ml dẻo dai, chịu được nước nóng đến 100°C và thích hợp ép màng nhựa chống tràn khi giao hàng qua ứng dụng.',
      },
    ],
    imageKey: 'cups',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa PP nguyên sinh' },
      { label: 'Dung tích', value: '700 ml (24 oz)' },
      { label: 'Đường kính miệng', value: '95 mm' },
      { label: 'Chịu nhiệt', value: 'Tối đa 100°C, ép được màng nhiệt' },
    ],
    packagingSpec: '1.000 cái / thùng (20 lốc x 50 cái)',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: true,
    status: 'published',
    relatedSlugs: ['ly-nhua-pet-500ml-nap-cau', 'tui-chu-t-dung-1-ly-hdpe'],
    seoTitle: 'Ly Nhựa PP 700ml Ép Màng Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Ly nhựa PP 700ml chịu nhiệt, ép màng seal miệng 95mm dành cho quán trà sữa, giao hàng mang đi (dữ liệu minh họa).',
  },
  {
    name: 'Ly Giấy Kraft 2 Lớp 360ml Nắp Uống Trực Tiếp (Minh họa)',
    slug: 'ly-giay-kraft-2-lop-360ml',
    sku: 'AP-LY-KR360',
    categorySlug: 'ly-coc-dung-mot-lan',
    shortDescription:
      'Sản phẩm minh họa: Ly giấy kraft 2 lớp cách nhiệt tốt cho cà phê nóng và trà nóng, không cần dùng thêm quấn tay rời.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Thiết kế cách nhiệt 2 lớp (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Cấu tạo hai lớp giấy định lượng cao với lớp tráng PE bên trong giúp giữ nhiệt ổn định và cầm nắm êm tay khi phục vụ đồ uống nóng.',
      },
    ],
    imageKey: 'cups',
    specs: [
      { label: 'Chất liệu', value: 'Giấy Kraft 2 lớp phủ PE thực phẩm' },
      { label: 'Dung tích', value: '360 ml (12 oz)' },
      { label: 'Đường kính miệng', value: '90 mm' },
      { label: 'Phụ kiện đi kèm', value: 'Nắp nhựa PP đen/trắng có nút gài' },
    ],
    packagingSpec: '500 cái / thùng (20 lốc x 25 cái)',
    minOrderQty: 4,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: false,
    status: 'published',
    relatedSlugs: ['ly-nhua-pet-500ml-nap-cau', 'tui-giay-kraft-nau-co-quai'],
    seoTitle: 'Ly Giấy Kraft 2 Lớp 360ml Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Ly giấy kraft 2 lớp 360ml cách nhiệt cho cà phê nóng, đóng thùng 500 cái, nhận báo giá sỉ nhanh (dữ liệu minh họa).',
  },
  {
    name: 'Hộp Nhựa PP Chữ Nhật 750ml Dùng Lò Vi Sóng (Minh họa)',
    slug: 'hop-nhua-pp-chu-nhat-750ml',
    sku: 'AP-HOP-PP750',
    categorySlug: 'hop-khay-thuc-pham',
    shortDescription:
      'Sản phẩm minh họa: Hộp chữ nhật nắp gài kín, chất liệu PP chịu nhiệt hâm nóng trực tiếp trong lò vi sóng.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Giải pháp đóng gói cơm & món nóng (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Nắp hộp thiết kế gờ khóa chắc chắn hạn chế rò rỉ nước sốt khi vận chuyển. Xếp chồng nhiều tầng gọn gàng tại khu bếp.',
      },
    ],
    imageKey: 'containers',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa PP 100% nguyên sinh' },
      { label: 'Dung tích', value: '750 ml' },
      { label: 'Kích thước', value: '172 x 120 x 58 mm' },
      { label: 'Chịu nhiệt', value: '-10°C đến 110°C (An toàn lò vi sóng)' },
    ],
    packagingSpec: '300 bộ / thùng (hộp + nắp)',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    price: 420000,
    showPrice: true,
    featured: true,
    status: 'published',
    relatedSlugs: ['hop-com-bento-4-ngan-pp', 'to-giay-kraft-750ml-nap-pet'],
    seoTitle: 'Hộp Nhựa PP Chữ Nhật 750ml Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Hộp nhựa chữ nhật PP 750ml nắp gài chắc chắn, chịu nhiệt lò vi sóng, quy cách 300 bộ/thùng (dữ liệu minh họa).',
  },
  {
    name: 'Hộp Cơm Bento 4 Ngăn PP Nắp Trong (Minh họa)',
    slug: 'hop-com-bento-4-ngan-pp',
    sku: 'AP-HOP-BT4N',
    categorySlug: 'hop-khay-thuc-pham',
    shortDescription:
      'Sản phẩm minh họa: Khay cơm 4 ngăn tách biệt cơm, món mặn, rau xào và đồ chấm, phù hợp suất ăn văn phòng.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Tối ưu trình bày suất ăn (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Bố cục 4 ngăn rõ ràng giữ hương vị từng món ăn riêng biệt, nắp nhựa PET/PP trong suốt giúp khách hàng dễ dàng quan sát phần ăn.',
      },
    ],
    imageKey: 'containers',
    specs: [
      { label: 'Chất liệu', value: 'Đế PP đen/trong, nắp PET trong' },
      { label: 'Số ngăn', value: '4 ngăn riêng biệt' },
      { label: 'Kích thước', value: '235 x 185 x 48 mm' },
      { label: 'Chịu nhiệt phần đế', value: 'Tối đa 110°C' },
    ],
    packagingSpec: '200 bộ / thùng',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: true,
    status: 'published',
    relatedSlugs: ['hop-nhua-pp-chu-nhat-750ml', 'tui-xop-2-quai-dung-hop-com'],
    seoTitle: 'Hộp Cơm Bento 4 Ngăn PP Nắp Trong | Bao Bì An Phát',
    seoDescription:
      'Hộp cơm văn phòng 4 ngăn chất liệu PP an toàn thực phẩm, nắp khít chống đổ khi giao hàng (dữ liệu minh họa).',
  },
  {
    name: 'Tô Giấy Kraft 750ml Kèm Nắp Nhựa Trong (Minh họa)',
    slug: 'to-giay-kraft-750ml-nap-pet',
    sku: 'AP-TO-KR750',
    categorySlug: 'hop-khay-thuc-pham',
    shortDescription:
      'Sản phẩm minh họa: Tô giấy kraft định lượng dày đựng salad, poke, bún trộn hoặc súp nóng, miệng tô bo tròn kín nắp.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Phù hợp món trộn và súp (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Mặt trong tô phủ lớp chống thấm dầu và nước, giữ form cứng cáp trong suốt quá trình vận chuyển đơn giao tận nơi.',
      },
    ],
    imageKey: 'containers',
    specs: [
      { label: 'Chất liệu', value: 'Giấy Kraft 300gsm + lớp phủ PE' },
      { label: 'Dung tích', value: '750 ml (26 oz)' },
      { label: 'Đường kính miệng', value: '150 mm' },
      { label: 'Loại nắp', value: 'Nắp nhựa PET trong hoặc nắp PP thoát hơi' },
    ],
    packagingSpec: '300 bộ / thùng',
    minOrderQty: 4,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: false,
    status: 'published',
    relatedSlugs: ['hop-nhua-pp-chu-nhat-750ml', 'tui-giay-kraft-nau-co-quai'],
    seoTitle: 'Tô Giấy Kraft 750ml Kèm Nắp Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Tô giấy kraft 750ml đựng salad, bún trộn, cháo súp kèm nắp PET/PP, giá sỉ theo thùng (dữ liệu minh họa).',
  },
  {
    name: 'Chai Nhựa PET Tròn 330ml Cổ Nắp Đen Niêm Phong (Minh họa)',
    slug: 'chai-nhua-pet-tron-330ml',
    sku: 'AP-CHAI-PET330',
    categorySlug: 'chai-hu-nhua-pet',
    shortDescription:
      'Sản phẩm minh họa: Chai PET 330ml thành dày trong suốt kèm nắp vặn có vòng garanty niêm phong cho nước ép, cold brew và trà sữa.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Nắp vặn niêm phong an toàn (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Đai garanty tự động khớp chặt khi vặn kín nắp lần đầu, giúp cửa hàng bảo đảm vệ sinh đồ uống đóng chai bán mang về hoặc ký gửi tủ mát.',
      },
    ],
    imageKey: 'bottles',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa PET nguyên sinh' },
      { label: 'Dung tích', value: '330 ml' },
      { label: 'Đường kính cổ', value: '30 mm (Nắp đen có vòng niêm phong)' },
      { label: 'Trọng lượng phôi', value: '18g' },
    ],
    packagingSpec: '200 chai / kiện (đóng bao PE kín bụi)',
    minOrderQty: 5,
    minOrderUnit: 'kiện',
    price: 360000,
    showPrice: true,
    featured: true,
    status: 'published',
    relatedSlugs: ['chai-nhua-pet-500ml-dang-cao', 'hu-nhua-pet-nap-nhom-500ml'],
    seoTitle: 'Chai Nhựa PET Tròn 330ml Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Chai nhựa PET 330ml trong suốt có vòng niêm phong nắp đen, chuyên dùng cho nước ép, cà phê ủ lạnh (dữ liệu minh họa).',
  },
  {
    name: 'Chai Nhựa PET 500ml Dáng Cao Cổ Rộng (Minh họa)',
    slug: 'chai-nhua-pet-500ml-dang-cao',
    sku: 'AP-CHAI-PET500',
    categorySlug: 'chai-hu-nhua-pet',
    shortDescription:
      'Sản phẩm minh họa: Chai PET 500ml dáng thon cao dễ dán nhãn decal, phù hợp nước detox, sữa hạt và trà trái cây đóng sẵn.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Bề mặt phẳng dễ dán tem nhãn (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Thân chai trụ đứng phẳng mịn, thuận tiện cho việc dán tem nhãn thương hiệu và xếp gọn trong tủ trưng bày.',
      },
    ],
    imageKey: 'bottles',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa PET nguyên sinh' },
      { label: 'Dung tích', value: '500 ml' },
      { label: 'Chiều cao tổng', value: '195 mm' },
      { label: 'Màu nắp tùy chọn', value: 'Đen / Trắng' },
    ],
    packagingSpec: '150 chai / kiện',
    minOrderQty: 6,
    minOrderUnit: 'kiện',
    showPrice: false,
    featured: false,
    status: 'published',
    relatedSlugs: ['chai-nhua-pet-tron-330ml', 'hu-nhua-pet-nap-nhom-500ml'],
    seoTitle: 'Chai Nhựa PET 500ml Dáng Cao Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Chai nhựa PET 500ml dáng cao thân thẳng dễ dán tem, đóng kiện 150 chai (dữ liệu minh họa).',
  },
  {
    name: 'Hũ Nhựa PET Nắp Nhôm Bạc 500ml Miệng Rộng (Minh họa)',
    slug: 'hu-nhua-pet-nap-nhom-500ml',
    sku: 'AP-HU-NH500',
    categorySlug: 'chai-hu-nhua-pet',
    shortDescription:
      'Sản phẩm minh họa: Hũ PET trong suốt kèm nắp vặn nhôm bạc có lót xốp PE chống ẩm, thích hợp đựng granola, hạt dinh dưỡng và mứt.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Bảo quản thực phẩm khô kín khí (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Nắp nhôm vặn ren kết hợp miếng lót xốp bên trong giúp hạn chế hơi ẩm xâm nhập, giữ độ giòn cho các loại hạt, bánh quy và trà khô.',
      },
    ],
    imageKey: 'bottles',
    specs: [
      { label: 'Chất liệu thân', value: 'Nhựa PET trong suốt' },
      { label: 'Chất liệu nắp', value: 'Nhôm bạc có đệm lót PE' },
      { label: 'Dung tích', value: '500 ml' },
      { label: 'Đường kính miệng', value: '85 mm' },
    ],
    packagingSpec: '120 hũ / thùng carton',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: true,
    status: 'published',
    relatedSlugs: ['chai-nhua-pet-tron-330ml', 'chai-nhua-pet-500ml-dang-cao'],
    seoTitle: 'Hũ Nhựa PET Nắp Nhôm 500ml Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Hũ nhựa PET miệng rộng 500ml nắp nhôm bạc có lót chống ẩm cho thực phẩm khô, hạt dinh dưỡng (dữ liệu minh họa).',
  },
  {
    name: 'Túi Giấy Kraft Nâu Có Quai Xoắn 26x12x32cm (Minh họa)',
    slug: 'tui-giay-kraft-nau-co-quai',
    sku: 'AP-TUI-KR2632',
    categorySlug: 'tui-bao-bi-giay',
    shortDescription:
      'Sản phẩm minh họa: Túi giấy kraft đáy rộng đứng vững, chịu tải tốt để đựng hộp cơm, hộp bánh hoặc 2-4 ly đồ uống.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Độ bền quai xoắn và đáy dán chắc (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Sử dụng giấy kraft định lượng 140gsm giúp túi đứng form gọn đẹp khi xếp đơn giao hàng, dễ dàng đóng dấu hoặc dán tem cửa hàng.',
      },
    ],
    imageKey: 'bags',
    specs: [
      { label: 'Chất liệu', value: 'Giấy Kraft nâu 140gsm' },
      { label: 'Kích thước (RxHxC)', value: '26 x 12 x 32 cm' },
      { label: 'Kiểu quai', value: 'Quai giấy xoắn gia cố miếng dán' },
      { label: 'Tải trọng khuyến nghị', value: 'Tối đa 3 kg' },
    ],
    packagingSpec: '200 túi / thùng',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: false,
    status: 'published',
    relatedSlugs: ['giay-goi-thuc-pham-chong-dau', 'hop-com-bento-4-ngan-pp'],
    seoTitle: 'Túi Giấy Kraft Nâu Có Quai Bán Sỉ | Bao Bì An Phát',
    seoDescription:
      'Túi giấy kraft quai xoắn kích thước 26x12x32cm đựng hộp cơm, hộp bánh, bán sỉ theo thùng (dữ liệu minh họa).',
  },
  {
    name: 'Giấy Gói Thực Phẩm Chống Thấm Dầu 30x30cm (Minh họa)',
    slug: 'giay-goi-thuc-pham-chong-dau',
    sku: 'AP-GIAY-GOI30',
    categorySlug: 'tui-bao-bi-giay',
    shortDescription:
      'Sản phẩm minh họa: Giấy lót khay và gói bánh mì, burger, đồ chiên với lớp phủ thực phẩm hạn chế thấm dầu mỡ ra tay.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Cắt sẵn tờ vuông tiện thao tác (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Đóng xấp 500 tờ cắt vuông đều đặn, rút nhanh tại quầy chế biến giúp tăng tốc độ ra món giờ cao điểm.',
      },
    ],
    imageKey: 'bags',
    specs: [
      { label: 'Chất liệu', value: 'Giấy thực phẩm MG chống thấm dầu' },
      { label: 'Kích thước', value: '30 x 30 cm' },
      { label: 'Định lượng', value: '38 gsm' },
      { label: 'Màu sắc', value: 'Trắng ngà tự nhiên không tẩy' },
    ],
    packagingSpec: '2.000 tờ / thùng (4 xấp x 500 tờ)',
    minOrderQty: 5,
    minOrderUnit: 'thùng',
    price: 390000,
    showPrice: true,
    featured: false,
    status: 'published',
    relatedSlugs: ['tui-giay-kraft-nau-co-quai', 'hop-nhua-pp-chu-nhat-750ml'],
    seoTitle: 'Giấy Gói Thực Phẩm Chống Dầu 30x30cm | Bao Bì An Phát',
    seoDescription:
      'Giấy gói burger, bánh mì và lót khay đồ chiên chống thấm dầu kích thước 30x30cm (dữ liệu minh họa).',
  },
  {
    name: 'Túi Chữ T & Túi Xốp Đựng Ly HDPE (Minh họa)',
    slug: 'tui-chu-t-dung-1-ly-hdpe',
    sku: 'AP-TUI-HDPE1L',
    categorySlug: 'tui-bao-bi-giay',
    shortDescription:
      'Sản phẩm minh họa: Túi nhựa HDPE dẻo trong mờ đựng 1 ly hoặc 2 ly mang đi, treo chắc chắn trên xe máy khi giao hàng.',
    blocks: [
      { kind: 'heading', tag: 'h2', text: 'Phù hợp giao hàng xe máy (Minh họa)' },
      {
        kind: 'paragraph',
        text: 'Thiết kế chữ T ôm sát thân ly giảm rung lắc khi di chuyển, tiết kiệm chi phí bao bì trên mỗi đơn đồ uống mang về.',
      },
    ],
    imageKey: 'bags',
    specs: [
      { label: 'Chất liệu', value: 'Nhựa HDPE nguyên sinh trong mờ' },
      { label: 'Phân loại', value: 'Túi 1 ly chữ T / Túi 2 ly vách ngăn' },
      { label: 'Đóng gói', value: '1 kg / bịch' },
      { label: 'Số lượng ước tính', value: '~220 – 250 túi / kg' },
    ],
    packagingSpec: '25 kg / bao (25 bịch x 1 kg)',
    minOrderQty: 2,
    minOrderUnit: 'bao',
    showPrice: false,
    featured: false,
    status: 'published',
    relatedSlugs: ['ly-nhua-pp-700ml-ep-mang', 'ly-nhua-pet-500ml-nap-cau'],
    seoTitle: 'Túi Chữ T & Túi Xốp Đựng Ly HDPE Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Túi chữ T đựng 1 ly và túi 2 ly vách ngăn chất liệu HDPE dẻo dai bán sỉ theo bao 25kg (dữ liệu minh họa).',
  },
  {
    name: 'Hộp Bã Mía 2 Ngăn Nội Bộ (Bản Nháp Kiểm Thử)',
    slug: 'hop-ba-mia-2-ngan-noi-bo-draft',
    sku: 'AP-DRAFT-BM02',
    categorySlug: 'hop-khay-thuc-pham',
    shortDescription:
      'Dữ liệu nháp nội bộ dùng để kiểm tra cơ chế chặn truy cập dữ liệu chưa xuất bản qua giao diện và API.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Nội dung bản nháp này không được phép hiển thị cho khách chưa đăng nhập.',
      },
    ],
    imageKey: 'containers',
    specs: [{ label: 'Trạng thái', value: 'Đang hoàn thiện thông số' }],
    packagingSpec: 'Đang cập nhật',
    minOrderQty: 10,
    minOrderUnit: 'thùng',
    showPrice: false,
    featured: false,
    status: 'draft',
    seoTitle: 'Bản nháp nội bộ',
    seoDescription: 'Bản nháp nội bộ không được index.',
  },
];

export const SEED_POST_CATEGORIES: SeedPostCategory[] = [
  {
    name: 'Hướng Dẫn Chọn Bao Bì',
    slug: 'huong-dan-chon-bao-bi',
    description: 'Kiến thức phân biệt chất liệu nhựa PET, PP, HDPE và bao bì giấy.',
  },
  {
    name: 'Tối Ưu Vận Hành F&B',
    slug: 'toi-uu-van-hanh-fb',
    description: 'Kinh nghiệm đóng gói giao hàng, quản lý tồn kho và tối ưu chi phí bao bì.',
  },
];

export const SEED_POSTS: SeedPost[] = [
  {
    title: 'Cách Phân Biệt Ly Nhựa PET Và Ly Nhựa PP Khi Nhập Sỉ Cho Quán (Minh họa)',
    slug: 'phan-biet-ly-nhua-pet-va-pp-khi-nhap-si',
    excerpt:
      'Bài viết minh họa giúp chủ quán cà phê, trà sữa chọn đúng loại ly PET hay PP theo nhiệt độ đồ uống, nhu cầu ép màng và ngân sách vận hành.',
    categorySlug: 'huong-dan-chon-bao-bi',
    authorName: 'Ban Biên Tập An Phát (Minh họa)',
    publishedAt: '2026-10-12T08:00:00.000Z',
    imageKey: 'cups',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Lưu ý: Đây là bài viết mẫu minh họa phục vụ kiểm thử cấu trúc blog chuyên ngành bao bì bán sỉ.',
      },
      { kind: 'heading', tag: 'h2', text: '1. Độ trong và khả năng chịu nhiệt' },
      {
        kind: 'paragraph',
        text: 'Ly nhựa PET có độ bóng và trong suốt nổi bật, rất phù hợp các món đá xay, trà trái cây hoặc cà phê sữa đá cần khoe lớp màu. Tuy nhiên nhựa PET chỉ phù hợp đồ uống lạnh dưới 45°C.',
      },
      {
        kind: 'paragraph',
        text: 'Ngược lại, ly nhựa PP hơi đục nhẹ nhưng dẻo dai và chịu nhiệt tới 100°C, cho phép rót trà nóng trực tiếp hoặc sử dụng máy ép màng miệng ly chống tràn khi giao hàng.',
      },
      { kind: 'heading', tag: 'h2', text: '2. Quy tắc chọn đường kính nắp đồng bộ' },
      {
        kind: 'list',
        listType: 'bullet',
        items: [
          'Kiểm tra đường kính miệng ly (90mm, 93mm, 95mm hoặc 98mm) trước khi đặt nắp.',
          'Ưu tiên nhập đồng bộ cùng lô thùng để tránh lệch khớp nắp khi bán giờ cao điểm.',
          'Tính toán không gian kho dựa trên quy cách 1.000 cái/thùng.',
        ],
      },
    ],
    relatedProductSlugs: ['ly-nhua-pet-500ml-nap-cau', 'ly-nhua-pp-700ml-ep-mang'],
    status: 'published',
    seoTitle: 'Phân Biệt Ly Nhựa PET Và PP Khi Nhập Sỉ | Bao Bì An Phát',
    seoDescription:
      'Hướng dẫn chọn ly nhựa PET và PP theo nhiệt độ đồ uống, nắp tương thích và chi phí nhập sỉ (bài viết minh họa).',
  },
  {
    title: 'Tiêu Chí Chọn Hộp Đựng Đồ Ăn Mang Đi An Toàn Nhiệt Độ Cao (Minh họa)',
    slug: 'tieu-chi-chon-hop-dung-do-an-mang-di',
    excerpt:
      'Bài viết minh họa tổng hợp các thông số cần kiểm tra khi đặt sỉ hộp cơm bento, hộp chữ nhật PP và tô giấy kraft cho bếp giao hàng.',
    categorySlug: 'huong-dan-chon-bao-bi',
    authorName: 'Đội Ngũ Kỹ Thuật Đóng Gói (Minh họa)',
    publishedAt: '2026-10-20T08:00:00.000Z',
    imageKey: 'containers',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Nội dung minh họa chia sẻ tiêu chuẩn chọn hộp thực phẩm cho mô hình cơm văn phòng và bếp giao hàng.',
      },
      { kind: 'heading', tag: 'h2', text: 'Kiểm tra ký hiệu nhựa chịu nhiệt và độ kín nắp' },
      {
        kind: 'list',
        listType: 'number',
        items: [
          'Ưu tiên hộp có phần đế bằng nhựa PP số 5 để khách hàng hâm nóng lại an toàn.',
          'Kiểm tra rãnh khóa nắp khi đựng món có nước sốt hoặc canh nóng.',
          'Chọn kích thước hộp vừa khít túi đựng để hạn chế nghiêng đổ trên xe giao hàng.',
        ],
      },
    ],
    relatedProductSlugs: ['hop-nhua-pp-chu-nhat-750ml', 'hop-com-bento-4-ngan-pp'],
    status: 'published',
    seoTitle: 'Tiêu Chí Chọn Hộp Đựng Đồ Ăn Mang Đi | Bao Bì An Phát',
    seoDescription:
      'Những thông số cần lưu ý khi nhập sỉ hộp nhựa PP, hộp bento và tô giấy kraft đựng đồ ăn nóng (bài viết minh họa).',
  },
  {
    title: 'Kinh Nghiệm Chọn Chai PET Và Hũ Nhựa Bảo Quản Đồ Uống Đóng Sẵn (Minh họa)',
    slug: 'chon-chai-pet-va-hu-nhua-bao-quan-do-uong',
    excerpt:
      'Bài viết minh họa phân tích độ dày phôi chai, vòng garanty niêm phong nắp và nắp nhôm lót chống ẩm cho thực phẩm đóng chai.',
    categorySlug: 'huong-dan-chon-bao-bi',
    authorName: 'Ban Biên Tập An Phát (Minh họa)',
    publishedAt: '2026-11-02T08:00:00.000Z',
    imageKey: 'blog',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Bài viết minh họa giúp các cơ sở nước ép, sữa hạt và đồ ăn vặt lựa chọn đúng dung tích chai và hũ PET.',
      },
      { kind: 'heading', tag: 'h2', text: 'Chọn trọng lượng phôi chai và nắp niêm phong' },
      {
        kind: 'paragraph',
        text: 'Với nước ép lạnh hoặc trà sữa đóng chai, trọng lượng phôi từ 18g đến 22g giúp thân chai cứng cáp không bị móp méo khi xếp thùng vận chuyển đường xa.',
      },
    ],
    relatedProductSlugs: ['chai-nhua-pet-tron-330ml', 'hu-nhua-pet-nap-nhom-500ml'],
    status: 'published',
    seoTitle: 'Chọn Chai PET Và Hũ Nhựa Đóng Sẵn | Bao Bì An Phát',
    seoDescription:
      'Hướng dẫn chọn dung tích chai PET, nắp niêm phong và hũ nhựa PET cho đồ uống, hạt khô (bài viết minh họa).',
  },
  {
    title: 'Cách Tính Định Mức Đặt Hàng Bao Bì Theo Tuần Cho Quán Mới Mở (Minh họa)',
    slug: 'tinh-dinh-muc-dat-hang-bao-bi-cho-quan-moi',
    excerpt:
      'Bài viết minh họa hướng dẫn ước lượng số lượng thùng ly, hộp, túi cần nhập trong tháng đầu để vừa đạt giá sỉ tốt vừa không tồn kho.',
    categorySlug: 'toi-uu-van-hanh-fb',
    authorName: 'Tư Vấn Chuỗi Cung Ứng (Minh họa)',
    publishedAt: '2026-11-10T08:00:00.000Z',
    imageKey: 'bags',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Nội dung minh họa hỗ trợ chủ quán mới lập kế hoạch đặt hàng theo số lượng đặt tối thiểu (MOQ) và diện tích kho thực tế.',
      },
      { kind: 'heading', tag: 'h2', text: 'Công thức ước lượng nhanh theo sản lượng ly/ngày' },
      {
        kind: 'list',
        listType: 'bullet',
        items: [
          'Quán bán trung bình 100 ly/ngày tiêu thụ khoảng 3.000 ly/tháng (tương đương 3 thùng 1.000 cái).',
          'Nên chia tỷ lệ 60% size tiêu chuẩn (500ml) và 40% size lớn (700ml) trong đợt nhập đầu.',
          'Luôn giữ tồn kho an toàn tối thiểu cho 7 ngày bán hàng.',
        ],
      },
    ],
    relatedProductSlugs: ['tui-giay-kraft-nau-co-quai', 'giay-goi-thuc-pham-chong-dau'],
    status: 'published',
    seoTitle: 'Cách Tính Định Mức Đặt Bao Bì Giá Sỉ | Bao Bì An Phát',
    seoDescription:
      'Hướng dẫn ước lượng số thùng bao bì cần nhập theo sản lượng bán hàng cho quán mới (bài viết minh họa).',
  },
];
