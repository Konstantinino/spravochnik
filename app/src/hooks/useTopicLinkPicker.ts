import { useCallback, useRef, useState } from 'react'
import type { GuideItem } from '../types'
import {
  focusCursor,
  getActivePlusQuery,
  replaceRangeWithTopicLink,
} from '../lib/textInsert'
import { clampPickerPosition, getTextareaCaretRect } from '../lib/textareaCaret'
import type { TopicLinkPickerState } from '../components/TopicLinkPicker'

export function useTopicLinkPicker(textareaRef: React.RefObject<HTMLTextAreaElement | null>) {
  const [linkPicker, setLinkPicker] = useState<TopicLinkPickerState | null>(null)
  /** `+` at this index was cancelled (e.g. space after it); ignore until that `+` is gone. */
  const dismissedPlusStartRef = useRef<number | null>(null)

  const clearPicker = useCallback(() => setLinkPicker(null), [])

  const closePicker = useCallback(() => {
    setLinkPicker((prev) => {
      if (prev?.mode === 'insert') {
        dismissedPlusStartRef.current = prev.start
      }
      return null
    })
  }, [])

  const positionForPlus = useCallback((el: HTMLTextAreaElement, plusIndex: number) => {
    const caret = getTextareaCaretRect(el, plusIndex)
    return clampPickerPosition(caret.left, caret.top + caret.height + 4)
  }, [])

  const syncLinkPickerFromTextarea = useCallback(
    (value: string, el: HTMLTextAreaElement) => {
      const dismissed = dismissedPlusStartRef.current
      if (dismissed != null && value[dismissed] !== '+') {
        dismissedPlusStartRef.current = null
      }

      const active = getActivePlusQuery(value, el.selectionStart)
      if (!active) {
        setLinkPicker((prev) => (prev?.mode === 'wrap' ? prev : null))
        return
      }

      // Space right after `+` cancels this plus permanently (until a new `+`).
      if (active.query.startsWith(' ')) {
        dismissedPlusStartRef.current = active.start
        setLinkPicker(null)
        return
      }

      if (dismissedPlusStartRef.current === active.start) {
        setLinkPicker(null)
        return
      }

      const pos = positionForPlus(el, active.start)
      setLinkPicker({
        mode: 'insert',
        start: active.start,
        end: active.end,
        query: active.query,
        left: pos.left,
        top: pos.top,
      })
    },
    [positionForPlus],
  )

  const handleAnswerChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>, setAnswer: (v: string) => void) => {
      const next = e.target.value
      setAnswer(next)
      syncLinkPickerFromTextarea(next, e.target)
    },
    [syncLinkPickerFromTextarea],
  )

  const handleAnswerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = textareaRef.current
      if (!el) return

      if ((e.key === '+' || (e.key === '=' && e.shiftKey)) && el.selectionStart !== el.selectionEnd) {
        e.preventDefault()
        dismissedPlusStartRef.current = null
        const pos = positionForPlus(el, el.selectionStart)
        setLinkPicker({
          mode: 'wrap',
          start: el.selectionStart,
          end: el.selectionEnd,
          query: '',
          left: pos.left,
          top: pos.top,
        })
        return
      }

      if (e.key === 'Escape' && linkPicker) {
        e.preventDefault()
        if (linkPicker.mode === 'insert') {
          dismissedPlusStartRef.current = linkPicker.start
        }
        setLinkPicker(null)
      }
    },
    [textareaRef, positionForPlus, linkPicker],
  )

  const pickTopicForLink = useCallback(
    (item: GuideItem, answer: string, setAnswer: (v: string) => void) => {
      if (!linkPicker) return
      const title =
        linkPicker.mode === 'wrap'
          ? answer.slice(linkPicker.start, linkPicker.end)
          : item.question
      const { next, cursor } = replaceRangeWithTopicLink(
        answer,
        linkPicker.start,
        linkPicker.end,
        item.id,
        title || item.question,
      )
      dismissedPlusStartRef.current = null
      setAnswer(next)
      setLinkPicker(null)
      focusCursor(textareaRef.current, cursor)
    },
    [linkPicker, textareaRef],
  )

  const setPickerQuery = useCallback((query: string) => {
    setLinkPicker((prev) => (prev ? { ...prev, query } : prev))
  }, [])

  return {
    linkPicker,
    setLinkPicker,
    clearPicker,
    closePicker,
    syncLinkPickerFromTextarea,
    handleAnswerChange,
    handleAnswerKeyDown,
    pickTopicForLink,
    setPickerQuery,
    dismissedPlusStartRef,
  }
}
