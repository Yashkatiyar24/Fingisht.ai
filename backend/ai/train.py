import argparse
import pandas as pd
from model_utils import CategoryModel


def load_csv(path: str):
    df = pd.read_csv(path)
    # expect columns: merchant, description, category_id (or category_name)
    return df


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--csv', required=True, help='Labeled transactions CSV')
    p.add_argument('--model-out', default='ai_model.joblib')
    args = p.parse_args()

    df = load_csv(args.csv)
    # build text by combining merchant + description
    df['text'] = (df.get('merchant','').fillna('') + ' ' + df.get('description','').fillna('')).str.strip()
    # category column could be category_name or category_id; prefer name
    if 'category_name' in df.columns:
        labels = df['category_name'].astype(str).tolist()
    elif 'category_id' in df.columns:
        labels = df['category_id'].astype(str).tolist()
    else:
        raise SystemExit('CSV must have category_name or category_id')

    texts = df['text'].astype(str).tolist()

    model = CategoryModel()
    model.fit(texts, labels)
    model.save(args.model_out)
    print('Saved model to', args.model_out)


if __name__ == '__main__':
    main()
