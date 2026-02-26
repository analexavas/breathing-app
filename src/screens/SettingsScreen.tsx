import { useState, useEffect } from 'react'
import type { Settings, StretchSet, StretchMove } from '../types'
import { PRESET_HUES, swatchColor, applyAccentHue } from '../utils/palette'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
}

// ── Stretch set editor modal ──────────────────────────────────────────────────

interface SetEditorProps {
  initial: StretchSet | null  // null = new
  onSave: (set: StretchSet) => void
  onClose: () => void
}

function SetEditor({ initial, onSave, onClose }: SetEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [moves, setMoves] = useState<StretchMove[]>(
    initial?.moves ?? [{ text: '', seconds: 30 }]
  )

  const updateMove = (i: number, field: keyof StretchMove, val: string | number) => {
    setMoves((ms) => ms.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)))
  }

  const addMove    = () => setMoves((ms) => [...ms, { text: '', seconds: 30 }])
  const removeMove = (i: number) => setMoves((ms) => ms.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!name.trim()) return
    const validMoves = moves.filter((m) => m.text.trim())
    if (validMoves.length === 0) return
    onSave({
      id:      initial?.id ?? crypto.randomUUID(),
      name:    name.trim(),
      enabled: initial?.enabled ?? true,
      moves:   validMoves
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? 'Редактировать набор' : 'Новый набор растяжки'}</h3>

        <div className="field">
          <label>Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="напр. Нижняя часть тела"
          />
        </div>

        <div className="field">
          <label>Упражнения</label>
          {moves.map((m, i) => (
            <div key={i} className="move-edit-row" style={{ marginBottom: 5 }}>
              <input
                value={m.text}
                onChange={(e) => updateMove(i, 'text', e.target.value)}
                placeholder="Описание упражнения"
              />
              <input
                className="sec"
                type="number"
                min={5}
                max={300}
                value={m.seconds}
                onChange={(e) => updateMove(i, 'seconds', Number(e.target.value))}
              />
              <button className="icon-sm" onClick={() => removeMove(i)} title="Удалить">
                ✕
              </button>
            </div>
          ))}
          <button className="btn btn-ghost" onClick={addMove} style={{ marginTop: 4 }}>
            + Добавить упражнение
          </button>
        </div>

        <div className="btn-row-h">
          <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
          <button className="btn btn-ghost"   onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ── Main settings screen ──────────────────────────────────────────────────────

export function SettingsScreen({ settings, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Settings>(settings)
  const [sets, setSets]   = useState<StretchSet[]>([])
  const [editingSet, setEditingSet] = useState<StretchSet | null | 'new'>(null)

  useEffect(() => {
    window.api.getStretchSets().then(setSets)
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    setLocal((s) => ({ ...s, [key]: val }))
    if (key === 'accent_hue') applyAccentHue(val as number)
  }

  const handleSave = () => onSave(local)

  const toggleSet = async (s: StretchSet) => {
    const updated = { ...s, enabled: !s.enabled }
    await window.api.updateStretchSet(updated)
    setSets((prev) => prev.map((x) => (x.id === s.id ? updated : x)))
  }

  const deleteSet = async (id: string) => {
    await window.api.deleteStretchSet(id)
    setSets((prev) => prev.filter((x) => x.id !== id))
  }

  const saveSet = async (newSet: StretchSet) => {
    if (editingSet === 'new') {
      const created = await window.api.createStretchSet(newSet)
      setSets((prev) => [...prev, created])
    } else {
      await window.api.updateStretchSet(newSet)
      setSets((prev) => prev.map((x) => (x.id === newSet.id ? newSet : x)))
    }
    setEditingSet(null)
  }

  return (
    <>
      <div className="screen" style={{ justifyContent: 'flex-start', overflowY: 'auto', paddingTop: 16 }}>
        <h2 style={{ alignSelf: 'flex-start' }}>Настройки</h2>

        {/* ── Палитра ───────────────────────────────────────────────────── */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 8 }}>
            Цвет
          </div>

          <div className="color-swatches">
            {PRESET_HUES.map(({ h, label }) => (
              <button
                key={h}
                className={`swatch${local.accent_hue === h ? ' active' : ''}`}
                style={{ background: swatchColor(h) }}
                onClick={() => set('accent_hue', h)}
                title={label}
              />
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={local.accent_hue}
              onChange={(e) => set('accent_hue', Number(e.target.value))}
              className="hue-slider"
              style={{
                flex: 1,
                appearance: 'none',
                WebkitAppearance: 'none',
                height: 6,
                borderRadius: 3,
                outline: 'none',
                cursor: 'pointer',
                background: `linear-gradient(to right,
                  hsl(0,70%,52%), hsl(30,70%,52%), hsl(60,70%,52%),
                  hsl(120,70%,52%), hsl(180,70%,52%), hsl(240,70%,52%),
                  hsl(300,70%,52%), hsl(359,70%,52%))`,
              }}
            />
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: swatchColor(local.accent_hue),
              boxShadow: `0 0 8px ${swatchColor(local.accent_hue)}`,
              border: '2px solid rgba(255,255,255,0.15)',
            }} />
          </div>
        </div>

        <div className="settings-grid">
          {/* Тема */}
          <div className="field">
            <label>Тема</label>
            <select
              value={local.theme}
              onChange={(e) => set('theme', e.target.value as Settings['theme'])}
            >
              <option value="warm">Тёплая</option>
              <option value="minimal">Минимальная</option>
              <option value="analytical">Аналитическая</option>
            </select>
          </div>

          {/* Длительности */}
          {(
            [
              ['pause_sec',   'Длительность паузы',           120, 360],
              ['touch_sec',   'Длительность касания задачи',  60,  300],
              ['walk_sec',    'Длительность прогулки',        120, 600],
              ['stretch_sec', 'Длительность растяжки',        120, 360]
            ] as [keyof Settings, string, number, number][]
          ).map(([key, label, min, max]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <div className="range-row">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={30}
                  value={local[key] as number}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
                <span className="range-val">
                  {Math.round((local[key] as number) / 60)} мин
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Менеджер наборов растяжки */}
        <div style={{ width: '100%', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Наборы растяжки
            </span>
            <button className="btn-ghost btn" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
              onClick={() => setEditingSet('new')}>
              + Новый
            </button>
          </div>

          <div className="set-list">
            {sets.map((s) => (
              <div key={s.id} className={`set-item${s.enabled ? ' enabled' : ''}`}>
                <button
                  className={`toggle ${s.enabled ? 'on' : ''}`}
                  onClick={() => toggleSet(s)}
                  title={s.enabled ? 'Отключить' : 'Включить'}
                />
                <span className="set-name">{s.name}</span>
                <span className="set-count">{s.moves.length} упр.</span>
                <button className="icon-sm" onClick={() => setEditingSet(s)} title="Редактировать">✎</button>
                <button className="icon-sm" onClick={() => deleteSet(s.id)} title="Удалить">🗑</button>
              </div>
            ))}
          </div>
        </div>

        <div className="btn-row-h" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
          <button className="btn btn-ghost"   onClick={onClose}>Закрыть</button>
        </div>
      </div>

      {editingSet !== null && (
        <SetEditor
          initial={editingSet === 'new' ? null : editingSet}
          onSave={saveSet}
          onClose={() => setEditingSet(null)}
        />
      )}
    </>
  )
}
