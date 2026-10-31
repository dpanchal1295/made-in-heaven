export const LANDING_CONTENT = {
  hero: {
    badge: 'YOUR WEDDING, PLANNED WITH CARE',
    headlineLine1: 'Celebrations of',
    headlineLine2: 'Lasting Joy',
    subline:
      'Maya, your personal wedding manager, helps Indian families plan the budget, timeline, decor, and attire, together.',
    ctaPrimary: 'START PLANNING',
    ctaSecondary: 'SIGN IN',
    scrollCue: 'SCROLL',
  },
  featured: {
    badge: 'MEET MAYA',
    title: 'Your personal wedding manager',
    paragraph:
      'Maya listens to your family’s traditions, helps allocate every rupee realistically by function, and builds itemized countdown timelines so nothing slips through.',
    cta: 'TALK TO MAYA',
  },
  suggestions: {
    badge: 'IDEAS MAYA SUGGESTS',
    sectionTitle: 'Tailored for Indian Celebrations',
    viewAll: 'VIEW ALL',
    label: 'Example ideas',
    disclaimer:
      'Illustrative aesthetic concepts generated to inspire your planning. Never real vendors or fixed prices.',
  },
  celebrations: {
    badge: 'BROWSE BY',
    sectionTitle: 'Celebrations',
    description: 'Explore traditions, rituals, and guest flows across all five quintessential functions.',
  },
  planTogether: {
    badge: 'PLAN TOGETHER',
    title: 'Bring both sides of the family together',
    paragraph:
      'Create shared family rooms where parents, siblings, and advisors can vote on decor themes, inspect schedules, and align on decisions without chaotic WhatsApp group threads.',
    linkText: 'SEE HOW IT WORKS',
  },
  statement: {
    badge: 'ABOUT',
    text: "A wedding is a family's story, told in rituals, flavours, and colours. Maya helps you plan it with clarity, so you can enjoy every moment.",
  },
  inspiration: {
    badge: 'INSPIRATION',
    title: 'A glimpse of the celebrations',
  },
  footer: {
    wordmark: 'Made in Heaven',
    tagline: 'Quietly brilliant Indian wedding planning with Maya.',
    builtFor: 'Built for the Hack2Skills AI Prompt War',
  },
};

export interface LandingContentConfig {
  eventType: 'wedding' | 'birthday' | 'community';
  themeClass: string;
  hero: {
    badge: string;
    headlineLine1: string;
    headlineLine2: string;
    italicWord?: string;
    subline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollCue: string;
    videoSrc?: string;
    posterSrc?: string;
    heroImageKey?: string;
  };
  featured: {
    badge: string;
    title: string;
    paragraph: string;
    cta: string;
    imageKey: string;
  };
  howItWorks: Array<{
    num: string;
    title: string;
    body: string;
  }>;
  suggestions: {
    badge: string;
    sectionTitle: string;
    viewAll: string;
    label: string;
    disclaimer: string;
    ideas: Array<{
      category: string;
      title: string;
      description: string;
      imageKey: string;
    }>;
  };
  celebrations: {
    badge: string;
    sectionTitle: string;
    description: string;
    items: Array<{
      title: string;
      subtitle: string;
      description: string;
      imageKey: string;
    }>;
  };
  planTogether: {
    badge: string;
    title: string;
    paragraph: string;
    linkText: string;
  };
  statement: {
    badge: string;
    text: string;
  };
  demoHomeId: string;
}

export const THEMED_LANDING_CONFIGS: Record<'wedding' | 'birthday' | 'community', LandingContentConfig> = {
  wedding: {
    eventType: 'wedding',
    themeClass: '[data-event-type="wedding"]',
    hero: {
      badge: 'YOUR WEDDING, PLANNED WITH CARE',
      headlineLine1: 'Celebrations of',
      headlineLine2: 'Lasting Joy',
      italicWord: 'Lasting',
      subline: 'Maya, your event manager, helping families plan the budget, timeline, decor and much more.',
      ctaPrimary: 'START PLANNING',
      ctaSecondary: 'HOW IT WORKS',
      scrollCue: 'SCROLL',
      heroImageKey: 'hero',
    },
    featured: {
      badge: 'MEET MAYA',
      title: 'Your personal wedding manager',
      paragraph: 'Maya listens to your family’s traditions, helps allocate every rupee realistically by function, and builds itemized countdown timelines so nothing slips through.',
      cta: 'TALK TO MAYA',
      imageKey: 'maya',
    },
    howItWorks: [
      {
        num: '01',
        title: 'Tell Maya your story',
        body: 'Chat or speak in your own language. Maya asks one question at a time: date, city, guests, budget, traditions and vibe.',
      },
      {
        num: '02',
        title: 'Get your full plan',
        body: 'Budget by function in rupees, a countdown timeline, vendor checklist, colour palette, decor and attire, all labelled as estimates.',
      },
      {
        num: '03',
        title: 'Plan as a family',
        body: 'Invite family into one Home. Everyone shares ideas in rooms like Venue, Food and Decor, and Maya turns them into clear options.',
      },
      {
        num: '04',
        title: 'Decide together',
        body: 'Voters choose by majority, with a runoff if needed and the couple breaking any tie. Your plan updates automatically.',
      },
    ],
    suggestions: {
      badge: 'IDEAS MAYA SUGGESTS',
      sectionTitle: 'Tailored for Indian Weddings',
      viewAll: 'VIEW ALL',
      label: 'Wedding concepts',
      disclaimer: '',
      ideas: [
        {
          category: 'Decor',
          title: 'Royal Peshwai Courtyard',
          description: 'Marigold arches, brass urlis with floating candles, and deep crimson drapes.',
          imageKey: 'decor',
        },
        {
          category: 'Attire',
          title: 'Heritage Temple Silks',
          description: 'Classic Paithani and Kanjeevaram weaves paired with traditional temple jewellery.',
          imageKey: 'attire',
        },
        {
          category: 'Food',
          title: 'Regional Festive Thali',
          description: 'Live puran poli counter, ukadiche modak, and fresh shrikhand cups.',
          imageKey: 'menu',
        },
        {
          category: 'Music',
          title: 'Classical Shehnai & Sangeet',
          description: 'Morning shehnai melodies followed by high-energy acoustic dhol for the sangeet.',
          imageKey: 'music',
        },
      ],
    },
    celebrations: {
      badge: 'BROWSE BY',
      sectionTitle: 'Wedding Functions',
      description: 'Explore traditions, rituals, and guest flows across all quintessential ceremonies.',
      items: [
        { title: 'Mehendi', subtitle: 'Intimate Afternoon', description: 'Intricate henna designs, acoustic folk songs, and refreshing afternoon coolers.', imageKey: 'mehendi' },
        { title: 'Haldi', subtitle: 'Auspicious Morning', description: 'Joyful turmeric paste blessings with floral showers and yellow attire.', imageKey: 'haldi' },
        { title: 'Sangeet', subtitle: 'Musical Evening', description: 'Choreographed family dances, lantern-lit stage, and festive beats.', imageKey: 'sangeet' },
        { title: 'Wedding', subtitle: 'The Sacred Vows', description: 'Vedic pheras around the holy fire with shehnai and fragrant floral mandap.', imageKey: 'wedding' },
        { title: 'Reception', subtitle: 'Grand Finale', description: 'Chandelier-lit banquet celebrating the newlyweds with extended family and friends.', imageKey: 'reception' },
      ],
    },
    planTogether: {
      badge: 'PLAN TOGETHER',
      title: 'Bring both sides of the family together',
      paragraph: 'Create shared family rooms where parents, siblings, and advisors can vote on decor themes, inspect schedules, and align on decisions without chaotic WhatsApp group threads.',
      linkText: 'SEE HOW IT WORKS',
    },
    statement: {
      badge: 'ABOUT',
      text: "A wedding is a family's story, told in rituals, flavours, and colours. Maya helps you plan it with clarity, so you can enjoy every moment.",
    },
    demoHomeId: 'demo-home-1',
  },

  birthday: {
    eventType: 'birthday',
    themeClass: '[data-event-type="birthday"]',
    hero: {
      badge: 'MILESTONE BIRTHDAYS, CHERISHED TOGETHER',
      headlineLine1: 'Celebrate Every',
      headlineLine2: 'Year of Life',
      italicWord: 'Year',
      subline: 'From a baby’s 1st year to a grandparent’s 60th Shashti Poorthi, Maya plans the morning puja, party venue, cake, and memories with your family.',
      ctaPrimary: 'PLAN A BIRTHDAY',
      ctaSecondary: 'HOW IT WORKS',
      scrollCue: 'SCROLL',
      videoSrc: '/images/birthday-hero.mp4',
      posterSrc: '/images/birthday-hero.jpg',
    },
    featured: {
      badge: 'MEET MAYA',
      title: 'Your thoughtful birthday planner',
      paragraph: 'Maya balances traditional morning rituals with vibrant evening celebrations. Coordinate guest lists across generations, manage the budget, choose entertainment, and organise memorable return gifts.',
      cta: 'TALK TO MAYA',
      imageKey: 'birthdayMaya',
    },
    howItWorks: [
      {
        num: '01',
        title: 'Tell Maya about the celebrant',
        body: 'Share the milestone (1st, 18th, 50th, 60th), favorite themes, guest age mix, and whether you are hosting a traditional puja, a dinner party, or both.',
      },
      {
        num: '02',
        title: 'Custom party schedule & budget',
        body: 'Maya drafts an itemized budget for cake, catering, entertainment, and gifts, alongside an organized timeline for family preparations.',
      },
      {
        num: '03',
        title: 'Collaborate with family',
        body: 'Involve cousins, siblings, and friends in private rooms to plan surprise videos, pick cake designs, and vote on party music.',
      },
      {
        num: '04',
        title: 'Decide seamlessly together',
        body: 'Family votes settle the venue and theme peacefully, leaving the host free to celebrate without stress.',
      },
    ],
    suggestions: {
      badge: 'IDEAS MAYA SUGGESTS',
      sectionTitle: 'Tailored for Indian Birthday Celebrations',
      viewAll: 'VIEW ALL',
      label: 'Birthday ideas',
      disclaimer: 'Curated creative concepts for decor, cakes, attire, and entertainment. Never real vendors or fixed prices.',
      ideas: [
        {
          category: 'Decor',
          title: 'Warm Shimmering Lounge',
          description: 'Fairy light canopies, bespoke memory photo frames, and customized milestone welcome boards.',
          imageKey: 'birthdayDecor',
        },
        {
          category: 'Catering & Cake',
          title: 'Artisanal Floral Tiered Cake',
          description: 'Cardamom-pistachio or classic rich Belgian chocolate paired with delicious live chaat counters.',
          imageKey: 'birthdayCake',
        },
      ],
    },
    celebrations: {
      badge: 'BROWSE BY',
      sectionTitle: 'Milestones & Gatherings',
      description: 'Cherish every chapter with rituals and festivities suited to each milestone.',
      items: [
        { title: '1st Birthday', subtitle: 'The Ayushya Homam', description: 'Pastel themes, auspicious morning blessings, soft play zones, and sweets for little guests.', imageKey: 'birthdayFirst' },
        { title: '18th Milestone', subtitle: 'Stepping into Tomorrow', description: 'Neon dancefloor, mocktail bar, fun photo booths, and an unforgettable evening with friends.', imageKey: 'birthdayTeen' },
        { title: '50th & 60th Jubilee', subtitle: 'Golden Milestones', description: 'Shashti Poorthi rituals, touching family retrospective slideshows, and elegant dinner banquets.', imageKey: 'birthdayMilestone' },
      ],
    },
    planTogether: {
      badge: 'PLAN TOGETHER',
      title: 'Coordinate surprises and preparations easily',
      paragraph: 'Bring siblings, cousins, and parents together to coordinate surprise gifts, allocate dinner courses, and plan music playlists without leaking secrets on WhatsApp.',
      linkText: 'EXPLORE BIRTHDAY PLANNING',
    },
    statement: {
      badge: 'ABOUT',
      text: 'Every milestone is a testament to love and shared memories. Maya helps your family honour each year with warmth, joy, and effortless elegance.',
    },
    demoHomeId: 'demo-home-2',
  },

  community: {
    eventType: 'community',
    themeClass: '[data-event-type="community"]',
    hero: {
      badge: 'FESTIVALS & SOCIETY EVENTS, ORGANIZED TOGETHER',
      headlineLine1: 'The Spirit of',
      headlineLine2: 'Community Joy',
      italicWord: 'Community',
      subline: 'From Navratri Garba nights and Ganesh Utsav to Diwali Melas and society cultural fests, Maya organizes pandals, permits, footfall, and volunteers.',
      ctaPrimary: 'ORGANIZE AN EVENT',
      ctaSecondary: 'HOW IT WORKS',
      scrollCue: 'SCROLL',
      heroImageKey: 'communityHero',
    },
    featured: {
      badge: 'MEET MAYA',
      title: 'Your community committee manager',
      paragraph: 'Managing public and society events requires teamwork. Maya helps committee members manage vendor permits, calculate prasad and catering quantities by expected footfall, and allocate volunteer shifts transparently.',
      cta: 'TALK TO MAYA',
      imageKey: 'communityMaya',
    },
    howItWorks: [
      {
        num: '01',
        title: 'Outline your event & footfall',
        body: 'Tell Maya about the festival, expected attendance (hundreds or thousands), ground setup, and society committee requirements.',
      },
      {
        num: '02',
        title: 'Pandal, safety & logistics plan',
        body: 'Receive structured checklists covering local police/fire permits, sound limits, first aid, generators, and security teams.',
      },
      {
        num: '03',
        title: 'Engage committee & volunteers',
        body: 'Assign leads to Food, Pandal, Sound, and Cultural rooms. Let volunteers submit ideas and keep sponsors informed.',
      },
      {
        num: '04',
        title: 'Transparent committee voting',
        body: 'Vote on orchestra vendors, decor bids, and budget approvals transparently with automatic runoff and majority tallies.',
      },
    ],
    suggestions: {
      badge: 'IDEAS MAYA SUGGESTS',
      sectionTitle: 'Tailored for Indian Community Celebrations',
      viewAll: 'VIEW ALL',
      label: 'Festival concepts',
      disclaimer: 'Practical layouts and festive concepts for society committees. Never real vendors or fixed prices.',
      ideas: [
        {
          category: 'Pandal & Stage',
          title: 'Eco-Friendly Grand Mandap',
          description: 'Natural bamboo frameworks, clay idols, banana stem arches, and solar fairy lights.',
          imageKey: 'communityDecor',
        },
        {
          category: 'Mahaprasad & Food',
          title: 'Wholesome Community Bhojan',
          description: 'Hygienic community kitchen logistics, organic leaf plates, and streamlined queue management.',
          imageKey: 'communityFood',
        },
        {
          category: 'Sound & Orchestra',
          title: 'Authentic Dhol & Sound Management',
          description: 'Professional directional acoustic sound systems respecting local decibel and curfew guidelines.',
          imageKey: 'communityMusic',
        },
      ],
    },
    celebrations: {
      badge: 'BROWSE BY',
      sectionTitle: 'Community Gatherings',
      description: 'Unite hundreds of families through shared heritage, devotion, and vibrant festivities.',
      items: [
        { title: 'Navratri Garba', subtitle: 'Nine Nights of Dance', description: 'Open-air wooden dancefloors, live orchestra sound, security queues, and prizes for best traditional attire.', imageKey: 'communityNavratri' },
        { title: 'Ganesh Utsav', subtitle: 'Eco Pandal & Visarjan', description: 'Daily aarti schedules, bhajan groups, modak distribution, and dignified eco-friendly immersion logistics.', imageKey: 'communityGanesh' },
        { title: 'Diwali Mela', subtitle: 'Festival of Lights', description: 'Society carnival stalls, diya painting contests, rangoli competitions, and evening sweets bazaar.', imageKey: 'communityDiwali' },
        { title: 'Society Cultural Fest', subtitle: 'Annual Day Gathering', description: 'Children’s performances, elder felicitation, friendly sports tournaments, and community potluck dinner.', imageKey: 'communitySociety' },
        { title: 'Community Holi', subtitle: 'Rangotsav Celebration', description: 'Organic herbal colours, thandai stations, rain dance enclosures, and eco-conscious water guidelines.', imageKey: 'communityHoli' },
      ],
    },
    planTogether: {
      badge: 'PLAN TOGETHER',
      title: 'Coordinate committee leads and volunteers without chaos',
      paragraph: 'Empower sub-committees for sound, catering, permits, and parking to collaborate in dedicated rooms, track task progress, and keep residents delighted.',
      linkText: 'SEE COMMITTEE WORKFLOW',
    },
    statement: {
      badge: 'ABOUT',
      text: 'Great communities are forged when neighbours gather in joy. Maya gives your committee the clarity and rhythm to host celebrations that bring everyone together.',
    },
    demoHomeId: 'demo-home-3',
  },
};
