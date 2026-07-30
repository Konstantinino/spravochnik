import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { GuideItem } from '../types'
import { isTelegramFileId, mediaSrcFromMarkdownUrl } from '../lib/markdown'

interface ViewerProps {
  item: GuideItem | null
  canEdit: boolean
  onEdit: () => void
}

function MediaUnavailable({ label }: { label: string }) {
  return <div className="media-unavailable">{label}</div>
}

export function Viewer({ item, canEdit, onEdit }: ViewerProps) {
  if (!item) {
    return (
      <div className="viewer viewer--empty">
        <p>Выберите тему слева, чтобы увидеть ответ</p>
      </div>
    )
  }

  const legacyPhotos = [
    ...(item.photo ? [item.photo] : []),
    ...(item.photos ?? []),
  ].filter(Boolean)

  const hasLegacyTelegram = legacyPhotos.some(isTelegramFileId)
  const localLegacy = legacyPhotos.filter((p) => !isTelegramFileId(p))

  return (
    <article className="viewer">
      <div className="viewer__header">
        <h1 className="viewer__title">{item.question}</h1>
        {canEdit && (
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            Изменить
          </button>
        )}
      </div>
      <div className="viewer__body markdown-body">
        {item.answer?.trim() ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => {
                const raw = src ?? ''
                if (isTelegramFileId(raw)) {
                  return <MediaUnavailable label="Медиа недоступно (Telegram)" />
                }
                const resolved = mediaSrcFromMarkdownUrl(raw)
                return (
                  <img
                    src={resolved}
                    alt={alt || ''}
                    className="viewer__image"
                    loading="lazy"
                  />
                )
              },
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {item.answer}
          </ReactMarkdown>
        ) : (
          <p className="muted">Текст ответа пока пуст</p>
        )}

        {localLegacy.length > 0 && (
          <div className="viewer__legacy-photos">
            {localLegacy.map((src) => (
              <img
                key={src}
                src={mediaSrcFromMarkdownUrl(src)}
                alt=""
                className="viewer__image"
              />
            ))}
          </div>
        )}

        {hasLegacyTelegram && (
          <MediaUnavailable label="Медиа недоступно (старый Telegram file_id)" />
        )}

        {(item.documents?.length ?? 0) > 0 && (
          <div className="viewer__docs">
            <h3>Документы</h3>
            <ul>
              {item.documents!.map((doc) => (
                <li key={`${doc.file_id}-${doc.file_name}`}>
                  {doc.file_name || 'Документ'} — медиа недоступно
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}
