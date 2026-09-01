import mango from '../assets/species/mango.jpg'
import custardApple from '../assets/species/custard-apple.jpg'
import teak from '../assets/species/teak.jpg'
import neem from '../assets/species/neem.jpg'
import tamarind from '../assets/species/tamarind.jpg'
import guava from '../assets/species/guava.jpg'
import jamun from '../assets/species/jamun.jpg'
import amla from '../assets/species/amla.jpg'
import pongamia from '../assets/species/pongamia.jpg'

export interface SpeciesPhoto {
  src: string
  /** object-position that keeps the tree in frame inside a wide crop */
  position: string
  credit: string
  license: string
  href: string
}

/**
 * Representative species photos for marketplace cards. These are real,
 * openly-licensed photos of each species, not photos of the fictional demo
 * trees; the marketplace says so next to the credits.
 */
export const SPECIES_PHOTOS: Record<string, SpeciesPhoto> = {
  Mango: {
    src: mango,
    position: 'center 32%',
    credit: 'Vinayaraj',
    license: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Mango_tree_Kerala_in_full_bloom.jpg',
  },
  'Custard Apple': {
    src: custardApple,
    position: 'center',
    credit: 'Adityamadhav83',
    license: 'CC BY-SA 3.0',
    href: 'https://commons.wikimedia.org/wiki/File:Annona_squamosa_raw_custard_apple_Thotlakonda_Visakhapatnam.JPG',
  },
  Teak: {
    src: teak,
    position: 'center 55%',
    credit: 'Adityamadhav83',
    license: 'CC BY 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Teak_plants_(Tectona_grandis)_at_Gudilova_temples.jpg',
  },
  Neem: {
    src: neem,
    position: 'center 28%',
    credit: 'Mukesh721',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Neem_tree_with_neem_fruits.jpg',
  },
  Tamarind: {
    src: tamarind,
    position: 'center 40%',
    credit: 'Salil Kumar Mukherjee',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Tamarind_tree_(Tamarindus_indica)_with_pods.jpg',
  },
  Guava: {
    src: guava,
    position: 'center 45%',
    credit: 'Sabina Bajracharya',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Guava_Tree_below_the_sky_02.jpg',
  },
  Jamun: {
    src: jamun,
    position: 'center 35%',
    credit: 'Kaushlendrapathe',
    license: 'CC0',
    href: 'https://commons.wikimedia.org/wiki/File:Jamun_Tree_in_Pragyapuram_Colony_Chhindwara.jpg',
  },
  Amla: {
    src: amla,
    position: 'center 45%',
    credit: 'Adityamadhav83',
    license: 'CC BY 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Amla_tree_(Phyllanthus_emblica)_at_Vivekananda_Park_in_Kakinada.jpg',
  },
  Pongamia: {
    src: pongamia,
    position: 'center 45%',
    credit: 'John Robert McPherson',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Millettia_pinnata_7th_Brigade_Park_Chermside_P1070621.jpg',
  },
}

/** Unique credits, for the marketplace attribution line. */
export function speciesPhotoCredits(): { credit: string; license: string; href: string }[] {
  const seen = new Set<string>()
  const out: { credit: string; license: string; href: string }[] = []
  for (const photo of Object.values(SPECIES_PHOTOS)) {
    const key = `${photo.credit}-${photo.license}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ credit: photo.credit, license: photo.license, href: photo.href })
    }
  }
  return out
}
