import {useEffect, useMemo, useRef, useState} from 'react'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient, useFormValue} from 'sanity'
import '../../js/colmeia-suggestions.js'

const sugestoesColmeia = globalThis.colmeiaSuggestedRelations || []
const API_VERSION = '2025-05-13'

function normalizarId(documentId = '') {
  return String(documentId).replace(/^drafts\./, '')
}

function criarChaveReferencia() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }

  return `colmeia${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function ColmeiaRelacionadosInput(props) {
  const {onItemAppend, readOnly, renderDefault, value = []} = props
  const client = useClient({apiVersion: API_VERSION})
  const documentId = normalizarId(useFormValue(['_id']))
  const [targets, setTargets] = useState({})
  const [loadState, setLoadState] = useState('idle')
  const [reloadToken, setReloadToken] = useState(0)
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())
  const [confirmingId, setConfirmingId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const confirmingIdsRef = useRef(new Set())

  const sugestoesDoDocumento = useMemo(() => {
    if (!documentId) return []

    return sugestoesColmeia
      .filter((sugestao) => sugestao.source === documentId || sugestao.target === documentId)
      .map((sugestao) => ({
        ...sugestao,
        targetId: sugestao.source === documentId ? sugestao.target : sugestao.source
      }))
  }, [documentId])

  const existingRefs = useMemo(
    () => new Set(value.map((reference) => normalizarId(reference?._ref)).filter(Boolean)),
    [value]
  )

  const targetIds = useMemo(
    () => [...new Set(sugestoesDoDocumento.map((sugestao) => sugestao.targetId))],
    [sugestoesDoDocumento]
  )
  const targetIdsKey = targetIds.join('|')

  useEffect(() => {
    setConfirmedIds(new Set())
    setConfirmingId('')
    setStatusMessage('')
    confirmingIdsRef.current.clear()
  }, [documentId])

  useEffect(() => {
    if (!targetIds.length) {
      setTargets({})
      setLoadState('ready')
      return undefined
    }

    let active = true
    setLoadState('loading')
    setStatusMessage('')

    client
      .fetch(
        `*[_id in $ids]{
          _id,
          "title": coalesce(titulo, autorNome, _id),
          "confirmsCurrent": coalesce($currentId in relacionados[]._ref, false)
        }`,
        {ids: targetIds, currentId: documentId}
      )
      .then((documents) => {
        if (!active) return
        setTargets(
          Object.fromEntries(
            documents.map((target) => [
              normalizarId(target._id),
              {
                id: normalizarId(target._id),
                title: target.title,
                confirmsCurrent: target.confirmsCurrent === true
              }
            ])
          )
        )
        setLoadState('ready')
      })
      .catch(() => {
        if (!active) return
        setTargets({})
        setLoadState('error')
      })

    return () => {
      active = false
    }
  }, [client, documentId, reloadToken, targetIdsKey])

  const sugestoesPendentes = sugestoesDoDocumento.filter((sugestao) => {
    const target = targets[sugestao.targetId]
    return !existingRefs.has(sugestao.targetId) &&
      !confirmedIds.has(sugestao.targetId) &&
      !target?.confirmsCurrent
  })

  function confirmarSugestao(sugestao) {
    const target = targets[sugestao.targetId]
    if (!target || readOnly || confirmingIdsRef.current.has(sugestao.targetId)) return

    confirmingIdsRef.current.add(sugestao.targetId)
    setConfirmingId(sugestao.targetId)

    try {
      onItemAppend({
        _key: criarChaveReferencia(),
        _type: 'reference',
        _ref: sugestao.targetId
      })
      setConfirmedIds((current) => new Set([...current, sugestao.targetId]))
      setStatusMessage(
        `Conexão adicionada com “${target.title}”. Publique o conteúdo para confirmar.`
      )
    } catch {
      setStatusMessage('Não foi possível adicionar a conexão. Tente novamente.')
    } finally {
      confirmingIdsRef.current.delete(sugestao.targetId)
      setConfirmingId('')
    }
  }

  if (!sugestoesDoDocumento.length) {
    return renderDefault(props)
  }

  return (
    <Stack space={4}>
      <Card border padding={4} radius={3} tone="primary">
        <Stack space={4}>
          <Stack space={2}>
            <Flex align="center" gap={3} justify="space-between" wrap="wrap">
              <Text size={1} weight="semibold">
                Sugestões da Colmeia
              </Text>
              {loadState === 'ready' && sugestoesPendentes.length > 0 && (
                <Text muted size={1}>
                  {sugestoesPendentes.length}{' '}
                  {sugestoesPendentes.length === 1 ? 'pendente' : 'pendentes'}
                </Text>
              )}
            </Flex>
            <Text muted size={1}>
              Confirme apenas relações que façam sentido editorialmente. A conexão será adicionada
              abaixo e só entrará no site depois da publicação.
            </Text>
          </Stack>

          {loadState === 'loading' && (
            <Flex align="center" gap={3}>
              <Spinner muted size={1} />
              <Text muted size={1}>
                Verificando sugestões...
              </Text>
            </Flex>
          )}

          {loadState === 'error' && (
            <Card padding={3} radius={2} tone="critical">
              <Flex align="center" gap={3} justify="space-between" wrap="wrap">
                <Text size={1}>Não foi possível carregar as sugestões.</Text>
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={() => setReloadToken((current) => current + 1)}
                  text="Tentar novamente"
                  tone="critical"
                />
              </Flex>
            </Card>
          )}

          {loadState === 'ready' && sugestoesPendentes.length === 0 && (
            <Text muted size={1}>
              Nenhuma sugestão pendente para este conteúdo.
            </Text>
          )}

          {loadState === 'ready' && sugestoesPendentes.length > 0 && (
            <Stack space={3}>
              {sugestoesPendentes.map((sugestao) => {
                const target = targets[sugestao.targetId]
                const unavailable = !target

                return (
                  <Card border key={sugestao.targetId} padding={3} radius={2}>
                    <Flex align="center" gap={3} justify="space-between" wrap="wrap">
                      <Box flex={1} style={{minWidth: '12rem', overflowWrap: 'anywhere'}}>
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            {target?.title || 'Conteúdo indisponível'}
                          </Text>
                          <Text muted size={1}>
                            {sugestao.via}
                          </Text>
                        </Stack>
                      </Box>
                      <Button
                        disabled={readOnly || unavailable || confirmingId === sugestao.targetId}
                        fontSize={1}
                        mode="ghost"
                        onClick={() => confirmarSugestao(sugestao)}
                        text="Confirmar conexão"
                        tone="primary"
                      />
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          )}

          {readOnly && (
            <Text muted size={1}>
              Você precisa de permissão de edição para confirmar conexões.
            </Text>
          )}

          {statusMessage && (
            <Text aria-live="polite" role="status" size={1}>
              {statusMessage}
            </Text>
          )}
        </Stack>
      </Card>

      {renderDefault(props)}
    </Stack>
  )
}
