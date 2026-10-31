export interface ImageItem {
  src: string | null;
  hoverSrc?: string | null;
  focus?: string;
  alt: string;
  credit?: string;
}

export type ImageKey =
  | 'hero'
  | 'maya'
  | 'mehendi'
  | 'haldi'
  | 'sangeet'
  | 'wedding'
  | 'reception'
  | 'decor'
  | 'attire'
  | 'menu'
  | 'music'
  | 'family'
  | 'about'
  // Birthday images
  | 'birthdayHero'
  | 'birthdayMaya'
  | 'birthdayDecor'
  | 'birthdayCake'
  | 'birthdayAttire'
  | 'birthdayMusic'
  | 'birthdayFirst'
  | 'birthdayTeen'
  | 'birthdayMilestone'
  | 'birthdayPuja'
  | 'birthdayParty'
  // Community images
  | 'communityHero'
  | 'communityMaya'
  | 'communityDecor'
  | 'communityFood'
  | 'communityAttire'
  | 'communityMusic'
  | 'communityNavratri'
  | 'communityGanesh'
  | 'communityDiwali'
  | 'communitySociety'
  | 'communityHoli';

export const APP_IMAGES: Record<ImageKey, ImageItem> = {
  hero: {
    src: '/images/hero.jpg',
    focus: '50% 50%',
    alt: 'Cream-white Rajasthani palace balcony with bougainvillea in bloom',
    credit: '',
  },
  maya: {
    src: '/images/maya.jpg',
    focus: '50% 40%',
    alt: 'Wooden desk with a laptop, a sage green notebook, and eucalyptus in a white pitcher',
    credit: '',
  },
  decor: {
    src: '/images/decor.jpg',
    hoverSrc: '/images/decor2.jpg',
    focus: '50% 50%',
    alt: 'Marigold flowers and lit tea lights arranged along a wooden ledge',
    credit: '',
  },
  attire: {
    src: '/images/attire.jpg',
    hoverSrc: '/images/attire2.jpg',
    focus: '50% 45%',
    alt: 'Red silk saree with gold temple jewellery, bangles, and sandals laid flat',
    credit: '',
  },
  menu: {
    src: '/images/menu.jpg',
    hoverSrc: '/images/menu2.jpg',
    focus: '50% 60%',
    alt: 'Layered salad served in small glasses on a wedding buffet',
    credit: '',
  },
  music: {
    src: '/images/music.jpg',
    hoverSrc: '/images/music2.jpg',
    focus: '38% 55%',
    alt: 'Black and white photo of hands playing the tabla',
    credit: '',
  },
  mehendi: {
    src: '/images/mehendi.jpg',
    focus: '50% 50%',
    alt: 'Henna-decorated hands resting on a pink embroidered outfit',
    credit: '',
  },
  haldi: {
    src: '/images/haldi.jpg',
    focus: '45% 50%',
    alt: 'Hands covered in turmeric paste during a haldi ceremony',
    credit: '',
  },
  sangeet: {
    src: '/images/sangeet.jpg',
    focus: '50% 40%',
    alt: 'Hanging cube lanterns wrapped in fairy lights at night',
    credit: '',
  },
  wedding: {
    src: '/images/wedding.jpg',
    focus: '48% 50%',
    alt: "Couple's hands holding puffed rice during a wedding ritual",
    credit: '',
  },
  reception: {
    src: '/images/reception.jpg',
    focus: '22% 50%',
    alt: 'Crystal candelabras and chandeliers over reception tables with stage lighting',
    credit: '',
  },
  family: {
    src: '/images/family.jpg',
    focus: '50% 50%',
    alt: 'Wedding procession with red embroidered umbrellas and guests in colourful turbans',
    credit: '',
  },
  about: {
    src: null,
    alt: 'Handcrafted wedding details and celebration planning',
    credit: '',
  },

  // Birthdays
  birthdayHero: {
    src: '/images/birthday-hero.jpg',
    focus: '50% 50%',
    alt: 'Festive birthday table setting with candles, lights, and celebration decor',
    credit: '',
  },
  birthdayMaya: {
    src: '/images/birthday-maya.jpg',
    focus: '50% 50%',
    alt: 'Planner notebook and floral arrangement prepared for birthday celebration planning',
    credit: '',
  },
  birthdayDecor: {
    src: '/images/birthday-decor.jpg',
    focus: '50% 50%',
    alt: 'Balloon arch with shimmering fairy lights and floral backdrop for a milestone birthday',
    credit: '',
  },
  birthdayCake: {
    src: '/images/birthday-cake.jpg',
    focus: '50% 50%',
    alt: 'Multi-tiered celebratory birthday cake decorated with fresh flowers and gold accents',
    credit: '',
  },
  birthdayAttire: {
    src: '/images/birthday-attire.jpg',
    focus: '50% 50%',
    alt: 'Festive birthday attire and accessories laid out for the celebration',
    credit: '',
  },
  birthdayMusic: {
    src: '/images/birthday-music.jpg',
    focus: '50% 50%',
    alt: 'Acoustic instruments and sound setup for live birthday evening entertainment',
    credit: '',
  },
  birthdayFirst: {
    src: '/images/birthday-first.jpg',
    focus: '50% 50%',
    alt: 'Whimsical pastel first birthday setup with soft toys and balloon garland',
    credit: '',
  },
  birthdayTeen: {
    src: '/images/birthday-teen.jpg',
    focus: '50% 50%',
    alt: 'Vibrant neon and lounge setup for an 18th milestone birthday party',
    credit: '',
  },
  birthdayMilestone: {
    src: '/images/birthday-milestone.jpg',
    focus: '50% 50%',
    alt: 'Elegant golden anniversary and 50th/60th milestone banquet table setting',
    credit: '',
  },
  birthdayPuja: {
    src: '/images/birthday-puja.jpg',
    focus: '50% 50%',
    alt: 'Traditional brass thali and marigold flowers for auspicious morning birthday puja',
    credit: '',
  },
  birthdayParty: {
    src: '/images/birthday-party.jpg',
    focus: '50% 50%',
    alt: 'Joyful family and friends celebrating an evening birthday dinner together',
    credit: '',
  },

  // Community Events
  communityHero: {
    src: '/images/community-hero.jpg',
    focus: '50% 50%',
    alt: 'Vibrant outdoor community festival illuminated under festive lights and pandal canopy',
    credit: '',
  },
  communityMaya: {
    src: '/images/community-maya.jpg',
    focus: '50% 50%',
    alt: 'Maya planning station with clipboard, stage layout, and volunteer badges',
    credit: '',
  },
  communityDecor: {
    src: '/images/community-decor.jpg',
    focus: '50% 50%',
    alt: 'Grand floral pandal entrance arch with traditional marigold garlands and fabric drapes',
    credit: '',
  },
  communityFood: {
    src: '/images/community-food.jpg',
    focus: '50% 50%',
    alt: 'Large-scale community feast preparation with traditional brass vessels and wholesome meal spread',
    credit: '',
  },
  communityAttire: {
    src: '/images/community-attire.jpg',
    focus: '50% 50%',
    alt: 'Traditional festival attire, colourful dupattas, and cultural volunteer ribbons',
    credit: '',
  },
  communityMusic: {
    src: '/images/community-music.jpg',
    focus: '50% 50%',
    alt: 'Dhol tasha and live percussion musicians performing at community celebration',
    credit: '',
  },
  communityNavratri: {
    src: '/images/community-navratri.jpg',
    focus: '50% 50%',
    alt: 'Hundreds of dancers in traditional chaniya choli and kediyu circling during Navratri Garba',
    credit: '',
  },
  communityGanesh: {
    src: '/images/community-ganesh.jpg',
    focus: '50% 50%',
    alt: 'Festive Ganesh Utsav pandal with traditional modak offerings and floral backdrop',
    credit: '',
  },
  communityDiwali: {
    src: '/images/community-diwali.jpg',
    focus: '50% 50%',
    alt: 'Community Diwali mela illuminated with hundreds of earthen diyas and hanging kandeels',
    credit: '',
  },
  communitySociety: {
    src: '/images/community-society.jpg',
    focus: '50% 50%',
    alt: 'Housing society residents gathering on the clubhouse lawn for an annual cultural evening',
    credit: '',
  },
  communityHoli: {
    src: '/images/community-holi.jpg',
    focus: '50% 50%',
    alt: 'Joyful community Holi celebration with natural gulal powders dancing in the air',
    credit: '',
  },
};
