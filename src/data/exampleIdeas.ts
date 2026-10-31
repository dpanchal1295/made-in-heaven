import { ImageKey } from '@/config/images';

export type IdeaCategory = 'DECOR' | 'ATTIRE' | 'MENU' | 'MUSIC';
export type IdeaCelebration = 'Wedding' | 'Sangeet' | 'Mehendi' | 'Haldi' | 'Reception';
export type IdeaCostTier = '₹' | '₹₹' | '₹₹₹';

export interface ExampleIdea {
  id: string;
  name: string;
  category: IdeaCategory;
  celebration: IdeaCelebration;
  costTier: IdeaCostTier;
  oneLine: string;
  description: string;
  imageKey: ImageKey;
}

export const EXAMPLE_IDEAS: ExampleIdea[] = [
  {
    id: 'idea-1',
    name: 'Royal Marigold & Candlelit Mandap',
    category: 'DECOR',
    celebration: 'Wedding',
    costTier: '₹₹',
    oneLine: 'Cascading indigenous marigold garlands with warm brass oil lamps.',
    description:
      'A timeless Vedic mandap setting bathed in natural hues of saffron, deep ochre, and warm brass. Featuring hand-strung marigold canopies, floating terracotta water urns with fresh jasmine petals, and gentle brass diyas that create an intimate ceremony ambiance under dusk skies.',
    imageKey: 'decor',
  },
  {
    id: 'idea-2',
    name: 'Raw Silk & Hand-Woven Ensemble',
    category: 'ATTIRE',
    celebration: 'Reception',
    costTier: '₹₹₹',
    oneLine: 'Handcrafted Banarasi weaves tailored with understated regal silhouettes.',
    description:
      'Refined evening attire honouring age-old textile heritage. For the bride, a crimson and antique zari Banarasi silk lehenga with minimal geometric embroidery; for the groom, a tailored raw silk bandhgala paired with muted gold churidars and heritage brass cufflinks.',
    imageKey: 'attire',
  },
  {
    id: 'idea-3',
    name: 'Regional Coastal & Royal Thali Feast',
    category: 'MENU',
    celebration: 'Sangeet',
    costTier: '₹₹',
    oneLine: 'Multi-course regional delicacies cooked live in open copper handis.',
    description:
      'A culinary journey celebrating authentic regional flavours. Guest stations feature live artisanal rotis on clay tandoors, saffron-infused pulao cooked over slow charcoal, fresh coastal coconut curries, and warm jalebis fried live with chilled rabdi.',
    imageKey: 'menu',
  },
  {
    id: 'idea-4',
    name: 'Acoustic Shehnai & Folk Percussion',
    category: 'MUSIC',
    celebration: 'Haldi',
    costTier: '₹',
    oneLine: 'Intimate acoustic morning ragas with dholak and rhythmic clapping.',
    description:
      'Live morning musical accompaniment designed to keep conversations effortless while maintaining an authentic ceremonial warmth. Master folk musicians perform soothing Raag Bhairav melodies on shehnai and sarangi, transitioning to cheerful Punjabi dholak beats during the turmeric ritual.',
    imageKey: 'music',
  },
  {
    id: 'idea-5',
    name: 'Open-Air Canopy of Jasmine & Bells',
    category: 'DECOR',
    celebration: 'Mehendi',
    costTier: '₹₹',
    oneLine: 'Suspended mogra tassels with miniature hand-beaten temple bells.',
    description:
      'An airy daytime retreat crafted for comfort during lengthy henna applications. Slender wooden pillars draped in unbleached cotton muslin support delicate jasmine trellises, surrounded by low hand-carved diwan seating and fragrant vetiver mist.',
    imageKey: 'decor',
  },
  {
    id: 'idea-6',
    name: 'Mustard Kurta & Chikankari Dupatta',
    category: 'ATTIRE',
    celebration: 'Haldi',
    costTier: '₹',
    oneLine: 'Lightweight breathable mulmul embroidered with delicate shadow work.',
    description:
      'Effortless sunshine silhouettes designed for joyous turmeric play. Made with ultra-soft organic cotton and authentic Lucknowi chikankari patterns that feel cool against the skin and dry quickly during celebratory splashes.',
    imageKey: 'attire',
  },
  {
    id: 'idea-7',
    name: 'Live Chaat & Street Food Bazaar',
    category: 'MENU',
    celebration: 'Mehendi',
    costTier: '₹',
    oneLine: 'Bespoke pani puri cart with mint waters and crisp seasonal bites.',
    description:
      'Interactive culinary stalls inspired by Old Delhi and Kolkata street markets. Custom artisanal carts serve chilled spiced waters in terracotta cups, crisp dahi sev batata puri, piping hot samosas, and fresh tender coconut water opened to order.',
    imageKey: 'menu',
  },
  {
    id: 'idea-8',
    name: 'Sufi & Qawwali Twilight Ensemble',
    category: 'MUSIC',
    celebration: 'Sangeet',
    costTier: '₹₹',
    oneLine: 'Soulful harmonium and tabla recitals building into high-tempo choruses.',
    description:
      'A hypnotic musical evening that bridges heritage classical ragas with joyous collective singing. A six-piece vocal and harmonium troupe engages family elders and young cousins alike in memorable call-and-response melodies.',
    imageKey: 'music',
  },
  {
    id: 'idea-9',
    name: 'Minimalist Water Basin & Floating Diyas',
    category: 'DECOR',
    celebration: 'Haldi',
    costTier: '₹',
    oneLine: 'Circular stone ponds filled with floating marigolds and natural stone lanterns.',
    description:
      'A zen-inspired courtyard concept utilizing reflective water mirrors, floating yellow lotus buds, and hand-carved stone urlis. Simple, striking, and photogenic without excessive disposable plastic or synthetic foam waste.',
    imageKey: 'decor',
  },
  {
    id: 'idea-10',
    name: 'Ivory Sherwani with Zardozi Collar',
    category: 'ATTIRE',
    celebration: 'Wedding',
    costTier: '₹₹₹',
    oneLine: 'Tailored textured jacquard sherwani with understated silver-thread details.',
    description:
      'An architectural silhouette balancing grandeur and comfort for long sacred rituals. Tailored in heavy textured ivory silk with subtle hand-worked zardozi at the mandarin collar, accompanied by a soft organza safa and embroidered mojris.',
    imageKey: 'attire',
  },
  {
    id: 'idea-11',
    name: 'Midnight Dessert Pavilion & Chai Bar',
    category: 'MENU',
    celebration: 'Reception',
    costTier: '₹₹',
    oneLine: 'Artisanal malai kulfi, kulhad chai, and warm halwa degustation.',
    description:
      'A comforting late-night finale set up after the main dinner banquet. Serving freshly steeped ginger lemongrass tea in clay cups, hand-churned pistachio kulfi slices on sal leaves, and warm moong dal halwa slowly simmered in pure ghee.',
    imageKey: 'menu',
  },
  {
    id: 'idea-12',
    name: 'Retro Vinyl & Classical Sitar Fusion',
    category: 'MUSIC',
    celebration: 'Wedding',
    costTier: '₹₹',
    oneLine: 'Live sitar accompaniment harmonized with gentle ambient cello strings.',
    description:
      'A reverent acoustic soundscape welcoming guests as they arrive at the mandap pavilion. Soothing afternoon ragas seamlessly weave traditional sitar arpeggios with classical cello harmonies for a calm, deeply emotional ceremony.',
    imageKey: 'music',
  },
  {
    id: 'idea-13',
    name: 'Bespoke Terracotta & Palm Leaf Mandap',
    category: 'DECOR',
    celebration: 'Reception',
    costTier: '₹₹',
    oneLine: 'Eco-conscious architecture created from woven palm mats and terracotta pottery.',
    description:
      'A sustainable and earth-centred aesthetic structure made entirely of compostable natural materials. Sun-dried palm thatch, raw earthen pots, woven hemp screens, and fragrant wild tuberoses give a grounded rustic elegance.',
    imageKey: 'decor',
  },
  {
    id: 'idea-14',
    name: 'Emerald Brocade Anarkali with Gota Patti',
    category: 'ATTIRE',
    celebration: 'Sangeet',
    costTier: '₹₹',
    oneLine: 'Full-flared jewel-toned silhouette crafted for movement on the dance floor.',
    description:
      'An eye-catching celebration ensemble designed specifically for fluid choreography and lively spins. Cut from deep emerald handloom brocade and edged with shimmering hand-beaten gold gota ribbons that catch ambient stage spotlights.',
    imageKey: 'attire',
  },
  {
    id: 'idea-15',
    name: 'Royal Satvik Feast in Silver Plating',
    category: 'MENU',
    celebration: 'Wedding',
    costTier: '₹₹₹',
    oneLine: 'Sacred wedding banquet cooked without onion or garlic with pure saffron and dry fruits.',
    description:
      'An exquisite Vedic wedding feast honouring temple culinary traditions. Fresh banana leaf platters serve dishes cooked with organic cold-pressed oils, whole spices, sun-dried Kashmiri saffron, crushed almonds, and freshly pressed coconut milk.',
    imageKey: 'menu',
  },
  {
    id: 'idea-16',
    name: 'Baraat Brass Brass Band & Dhol Players',
    category: 'MUSIC',
    celebration: 'Wedding',
    costTier: '₹',
    oneLine: 'Classic celebratory brass section leading high-energy procession rhythms.',
    description:
      'The quintessential Indian baraat energy orchestrated with disciplined musicianship. High-energy Punjabi and Rajasthani dhol beats accompanied by brass trumpets and trombones, guiding the groom and family along the celebratory procession route.',
    imageKey: 'music',
  },
  {
    id: 'idea-17',
    name: 'Fairy Light Forest & Brass Candelabras',
    category: 'DECOR',
    celebration: 'Reception',
    costTier: '₹₹₹',
    oneLine: 'Canopy of ten thousand warm micro-lights draped across garden banyan trees.',
    description:
      'An enchanting outdoor starlit dinner atmosphere. Grand aged banyan trees are illuminated with delicate cascading micro-lights, complemented by towering antique brass candelabras and botanical table runners on natural raw wood banquet tables.',
    imageKey: 'decor',
  },
  {
    id: 'idea-18',
    name: 'Pastel Organza Saree with Pearl Borders',
    category: 'ATTIRE',
    celebration: 'Mehendi',
    costTier: '₹₹',
    oneLine: 'Feather-light powder peach saree hand-embellished with micro seed pearls.',
    description:
      'A romantic and breezy daytime attire choice that looks weightless and photographs beautifully in soft daylight. Crafted in crisp pure silk organza with scalloped hand-cut edges bordered by clusters of freshwater seed pearls.',
    imageKey: 'attire',
  },
];
