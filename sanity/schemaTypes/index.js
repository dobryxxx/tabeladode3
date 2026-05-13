import {author} from './author.js'
import {category} from './category.js'
import {draftProspect} from './draftProspect.js'
import {glossaryTerm} from './glossaryTerm.js'
import {post} from './post.js'
import {ranking} from './ranking.js'
import {homeSettings, siteSettings} from './settings.js'
import {blockContent, homeCard, imageWithAlt, rankingItem, socialLink} from './objects.js'

export const schemaTypes = [
  imageWithAlt,
  blockContent,
  homeCard,
  socialLink,
  rankingItem,
  author,
  category,
  post,
  draftProspect,
  ranking,
  glossaryTerm,
  homeSettings,
  siteSettings
]
