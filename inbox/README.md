# Box Score Data Inbox

This directory holds box score data for testing and development. Data flows from raw fetched files through normalization into processed JSON, with interesting games promoted to fixtures for test use.

## Directory Structure

**raw/** contains unprocessed data fetched from sources. Files are named by date and game code, like `2024-01-26_wbkb_20240126_euf7.xml`. These files are gitignored since they're large and reproducible.

**processed/** contains normalized BoxScore JSON files ready for use by the specialist prompts. Files follow the pattern `YYYY-MM-DD_home-vs-away.json`. Also gitignored.

**fixtures/** contains hand-picked test data committed to version control. Each fixture includes metadata explaining why it was selected, such as notable triggers or interesting game patterns. Tests depend on these files.

## Data Source

The primary data source is College of Marin athletics at `athletics.marin.edu`. Box scores are available as XML files for both men's basketball (`/sports/mbkb/`) and women's basketball (`/sports/wbkb/`).

## File Naming Conventions

Raw files preserve the source's game code: `YYYY-MM-DD_sport_gamecode.xml`

Processed files use readable names: `YYYY-MM-DD_home-vs-away.json`

Fixtures include a descriptive slug: `double-double-comeback_2024-01-15.json`

## Usage

Fetch raw data using the fetcher tool:
```bash
npx ts-node tools/fetch-boxscores.ts --sport wbkb --season 2023-24
```

Normalize raw data:
```bash
npx ts-node tools/normalize-boxscores.ts
```

Curate fixtures from processed data:
```bash
npx ts-node tools/curate-fixtures.ts --scan
```
