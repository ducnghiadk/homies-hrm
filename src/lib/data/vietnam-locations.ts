export type Ward = string

export type District = {
  id: string
  name: string
  wards: Ward[]
}

export type Province = {
  id: string
  name: string
  districts: District[]
}

export const VIETNAM_PROVINCES: Province[] = [
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        id: 'thu-duc',
        name: 'TP. Thủ Đức',
        wards: [
          'Phường Phước Long A',
          'Phường Phước Long B',
          'Phường Tăng Nhơn Phú A',
          'Phường Tăng Nhơn Phú B',
          'Phường Hiệp Phú',
          'Phường Long Thạnh Mỹ',
          'Phường Tân Phú',
          'Phường Linh Trung',
          'Phường Linh Chiểu',
          'Phường Linh Tây',
          'Phường Linh Đông',
          'Phường An Phú',
          'Phường Thảo Điền',
          'Phường An Khánh',
          'Phường Bình Trưng Tây',
          'Phường Bình Trưng Đông',
        ],
      },
      {
        id: 'quan-1',
        name: 'Quận 1',
        wards: [
          'Phường Bến Nghé',
          'Phường Bến Thành',
          'Phường Phạm Ngũ Lão',
          'Phường Nguyễn Thái Bình',
          'Phường Cầu Ông Lãnh',
          'Phường Đa Kao',
          'Phường Tân Định',
          'Phường Nguyễn Cư Trinh',
          'Phường Cầu Kho',
        ],
      },
      {
        id: 'quan-3',
        name: 'Quận 3',
        wards: [
          'Phường Võ Thị Sáu',
          'Phường 1',
          'Phường 2',
          'Phường 3',
          'Phường 4',
          'Phường 5',
          'Phường 9',
          'Phường 10',
          'Phường 11',
          'Phường 12',
          'Phường 14',
        ],
      },
      {
        id: 'binh-thanh',
        name: 'Quận Bình Thạnh',
        wards: [
          'Phường 1',
          'Phường 2',
          'Phường 3',
          'Phường 5',
          'Phường 11',
          'Phường 13',
          'Phường 15',
          'Phường 17',
          'Phường 19',
          'Phường 22',
          'Phường 25',
          'Phường 26',
          'Phường 27',
          'Phường 28',
        ],
      },
      {
        id: 'tan-binh',
        name: 'Quận Tân Bình',
        wards: [
          'Phường 1',
          'Phường 2',
          'Phường 3',
          'Phường 4',
          'Phường 11',
          'Phường 12',
          'Phường 13',
          'Phường 14',
          'Phường 15',
        ],
      },
      {
        id: 'go-vap',
        name: 'Quận Gò Vấp',
        wards: [
          'Phường 1',
          'Phường 3',
          'Phường 5',
          'Phường 7',
          'Phường 10',
          'Phường 11',
          'Phường 16',
          'Phường 17',
        ],
      },
      {
        id: 'quan-7',
        name: 'Quận 7',
        wards: [
          'Phường Tân Thuận Đông',
          'Phường Tân Thuận Tây',
          'Phường Tân Kiểng',
          'Phường Tân Phong',
          'Phường Tân Phú',
          'Phường Bình Thuận',
          'Phường Phú Mỹ',
        ],
      },
      {
        id: 'quan-10',
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 12', 'Phường 13', 'Phường 15'],
      },
    ],
  },
  {
    id: 'ha-noi',
    name: 'TP. Hà Nội',
    districts: [
      {
        id: 'hoan-kiem',
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Hàng Bồ', 'Phường Tràng Tiền'],
      },
      {
        id: 'ba-dinh',
        name: 'Quận Ba Đình',
        wards: ['Phường Cống Vị', 'Phường Điện Biên', 'Phường Kim Mã', 'Phường Ngọc Khánh'],
      },
      {
        id: 'cau-giay',
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Trung Hòa'],
      },
    ],
  },
  {
    id: 'da-nang',
    name: 'TP. Đà Nẵng',
    districts: [
      {
        id: 'hai-chau',
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Phước Ninh', 'Phường Hòa Cường Bắc'],
      },
      {
        id: 'son-tra',
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Tây', 'Phường Phước Mỹ'],
      },
    ],
  },
  {
    id: 'binh-duong',
    name: 'Tỉnh Bình Dương',
    districts: [
      {
        id: 'thu-dau-mot',
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Phú Hòa', 'Phường Chánh Nghĩa'],
      },
      {
        id: 'thuan-an',
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Bình Nhâm'],
      },
    ],
  },
]
