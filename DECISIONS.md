## HOW I INTERPRETED THE BRIEF

### WHAT I CHOSE TO BUILD

### WHAT I CHOSE NOT TO BUILD

... I chose a conventional REST API with optional HTTP streaming for AI responses rather than WebSockets because the application's chat interaction is fundamentally request/response, making REST substantially simpler to build and deploy while still allowing a ChatGPT-like streaming experience later; content-management endpoints will be designed but deprioritized because the brief makes admin workflows optional and the core assessment is better served by a complete public content and AI experience.

## HOW I STORED CONTENT AND TRANSLATIONS

After going through the dataset, I came up with this data model: 
                         ┌────────────────────┐
                         │      authors       │
                         ├────────────────────┤
                         │ id                 │
                         │ name               │
                         │ created_at         │
                         │ updated_at         │
                         └─────────┬──────────┘
                                   │
                                  1│
                                   │N
                         ┌─────────▼──────────┐
                         │      articles      │
                         ├────────────────────┤
                         │ id                 │
                         │ content_type       │
                         │ topic              │
                         │ author_id          │
                         │ status             │
                         │ created_at         │
                         │ updated_at         │
                         └─────────┬──────────┘
                                   │
                                  1│
                                   │N
                         ┌─────────▼──────────┐
                         │    translations    │
                         ├────────────────────┤
                         │ id                 │
                         │ article_id         │
                         │ language_id        │
                         │ title              │
                         │ summary            │
                         │ body               │
                         │ created_at         │
                         │ updated_at         │
                         └──────┬─────────┬───┘
                                │         │
                               N│         │1
                                │         │
                     ┌──────────▼───┐ ┌───▼────────────┐
                     │    chunks    │ │    languages   │
                     ├──────────────┤ ├────────────────┤
                     │ id           │ │ id             │
                     │ translation_id││ code           │
                     │ content      │ │ name           │
                     │ chunk_index  │ │ created_at     │
                     │ embedding    │ └────────────────┘
                     │ created_at   │
                     └──────────────┘

I made the following decisions:
1. I used PostgreSQL as the runtime content store.
2. I made an Authors table, with a one to many relationship to articles, this allows for new authors without schema changes.
3. I gave Translations a separate table, this allows for new languages without schema changes.
4. I made a Language table instead of an application enum, this allows for new languages without schema changes.
5. I kept a single name field in Authors because the source data contained names specifically with prefixes and middle names, therefore trying to infer structured first/last names from these will lead to inconsistent and potentially incorrect data.
6. User-facing content is not globally lowercased, although this normalization applies to fields used for matching, categorization and lookup.
7. Dates are normalized during ingestion to PostgreSQL timestamptz.
8. Titles are not globally unique, however (article_id, language_id) is unique in translations.
9. Draft content is excluded from the published AI knowledge base.
10. CSV ingestion is handled by a repeatable import/cleaning pipeline, rather than manually transforming the supplied data.
11. Chunking/embeddings are asynchronous, so publishing content does not make the request itself wait on AI/vector processing.

## HOW I HANDLED THE SUPPLIED DATA

For the supplied data, I first established normalization rules in line with the database model. I then created a one time ingestion script to normalize and ingest the supplied data into the database. I kept ingestion as an explicit, deterministic pipeline with pure normalization/cleaning functions separated from database writes. That makes the messy-data decisions testable, keeps the database layer simple, and gives us a clean place to document exactly how the supplied content was transformed—one of the assessment's explicit evaluation areas. Future insertions into the database will follow the set validation -> insertion pipeline. 

### NORMALIZATION RULES
| Field         | Rule                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `title`       | trim, decode HTML entities, strip HTML, collapse whitespace          |
| `summary`     | same; preserve `null` when absent                                    |
| `body`        | strip HTML, decode entities, collapse whitespace                     |
| `topic`       | lowercase → canonical topic mapping                                  |
| `status`      | `draft` → draft; `published`, `Published`, `TRUE`, `yes` → published |
| `date`        | parse supported formats; missing → `createdAt`/`updatedAt` fallback  |
| `author`      | trim; missing → `"Unknown"`                                          |
| `contentType` | `article` because the source has no content-type field               |
| language      | English = `en`; Pidgin = `pcm`                                       |
| empty strings | treated as null where the database permits it                        |

### DEDUPLICATION RULES
1. Topic canonicalization is explicit
2. Exact normalized title + body → duplicate.
3. Very high combined title/body similarity → near-duplicate.
4. Near-duplicates are merged only when the content is substantively the same.
5. Same topic or similar subject alone never causes merging.
6. When merging, retain the first/source-earliest row as canonical and log the duplicate source IDs.
7. A re-run must not create another copy.

## MY ARCHITECTURE

### KEY DECISIONS 

### TRADE OFFS

## HOW I USED AI TO BUILD THIS

## WHAT I WOULD DO NEXT WITH ANOTHER WEEK
- Usage/Audit logging. 
- Server-side caching. 
- Tracking for token costs. 

