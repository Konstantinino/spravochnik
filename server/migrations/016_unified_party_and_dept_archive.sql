-- Унификация с техподдержкой: topics.party для всех отделов, архивные подразделы per department.

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_party_check;

-- Корневые темы не-support: party = id раздела (верхний уровень department_subsections).
UPDATE topics t
SET party = resolved.section_party
FROM (
  SELECT
    t2.department_id,
    t2.id AS topic_id,
    CASE
      WHEN ds.id IS NULL THEN NULL
      WHEN ds.party IS NOT NULL AND btrim(ds.party) <> '' THEN btrim(ds.party)
      ELSE ds.id
    END AS section_party
  FROM topics t2
  LEFT JOIN department_subsections ds
    ON ds.id = t2.subsection_id AND ds.department_id = t2.department_id
  WHERE t2.deleted_at IS NULL
    AND t2.parent_id IS NULL
    AND t2.department_id <> 'support'
) AS resolved
WHERE t.department_id = resolved.department_id
  AND t.id = resolved.topic_id
  AND resolved.section_party IS NOT NULL
  AND (t.party IS NULL OR btrim(t.party) = '');

-- Подтемы: party как у родителя.
UPDATE topics child
SET party = parent.party
FROM topics parent
WHERE child.deleted_at IS NULL
  AND child.parent_id = parent.id
  AND child.department_id = parent.department_id
  AND parent.party IS NOT NULL
  AND btrim(parent.party) <> ''
  AND (child.party IS NULL OR btrim(child.party) = '');

-- Служебные подразделы архива для каждого рабочего отдела (кроме support — уже есть).
INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
SELECT
  d.id || '__archive__archived',
  d.id,
  'Архивированные',
  9998,
  NULL,
  false,
  true
FROM departments d
WHERE d.list_key = 'questions'
  AND d.id NOT IN ('support', 'lost', 'templates')
ON CONFLICT (id) DO UPDATE SET
  is_archive_archived = true,
  is_archive_lost = false,
  label = 'Архивированные';

INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
SELECT
  d.id || '__archive__lost',
  d.id,
  'Потерянные',
  9999,
  NULL,
  true,
  false
FROM departments d
WHERE d.list_key = 'questions'
  AND d.id NOT IN ('support', 'lost', 'templates')
ON CONFLICT (id) DO UPDATE SET
  is_archive_lost = true,
  is_archive_archived = false,
  label = 'Потерянные';

-- Архивные темы не-support → bucket «Архивированные».
UPDATE topics t
SET subsection_id = t.department_id || '__archive__archived'
WHERE t.archived = true
  AND t.deleted_at IS NULL
  AND t.department_id <> 'support'
  AND (t.subsection_id IS NULL OR t.subsection_id !~ '__archive__(lost|archived)$');
