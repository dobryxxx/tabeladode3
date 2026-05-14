import {author} from './author.js'
import {category} from './category.js'
import {draftProspect} from './draftProspect.js'
import {glossaryTerm} from './glossaryTerm.js'
import {nbaTeam} from './nbaTeam.js'
import {post} from './post.js'
import {ranking} from './ranking.js'
import {tip} from './tip.js'
import {draftGuideSettings, homeSettings, siteSettings} from './settings.js'
import {blockContent, draftBoardItem, homeCard, imageWithAlt, rankingItem, socialLink, tweetEmbed} from './objects.js'

export const schemaTypes = [
  imageWithAlt,
  blockContent,
  tweetEmbed,
  homeCard,
  socialLink,
  rankingItem,
  draftBoardItem,
  author,
  category,
  nbaTeam,
  post,
  tip,
  draftProspect,
  ranking,
  glossaryTerm,
  homeSettings,
  siteSettings,
  draftGuideSettings
]
