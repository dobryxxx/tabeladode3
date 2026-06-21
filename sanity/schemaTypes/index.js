import {author} from './author.js'
import {category} from './category.js'
import {conexao} from './conexao.js'
import {draftProspect} from './draftProspect.js'
import {glossaryTerm} from './glossaryTerm.js'
import {nbaTeam} from './nbaTeam.js'
import {post} from './post.js'
import {ranking} from './ranking.js'
import {tip} from './tip.js'
import {tweetCard} from './tweetCard.js'
import {colmeiaSettings, draftGuideSettings, draftReviewSettings, homeSettings, siteSettings} from './settings.js'
import {blockContent, draftBoardItem, draftReviewPick, homeCard, imageWithAlt, rankingItem, socialLink, tweetEmbed} from './objects.js'

export const schemaTypes = [
  imageWithAlt,
  blockContent,
  tweetEmbed,
  homeCard,
  socialLink,
  rankingItem,
  draftBoardItem,
  draftReviewPick,
  author,
  category,
  nbaTeam,
  post,
  tip,
  tweetCard,
  conexao,
  draftProspect,
  ranking,
  glossaryTerm,
  homeSettings,
  siteSettings,
  draftGuideSettings,
  draftReviewSettings,
  colmeiaSettings
]
