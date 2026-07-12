use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::Write;

// 日本郵便の utf_ken_all.csv（1レコード1行・UTF-8）から postalCode/csv/ を直接生成する。
//
// 変換規則は、アイビス社の「郵便番号データ（加工済バージョン）」由来の既存データ
// （コミット済みの postalCode/csv/）との全件一致を検証して導出したもの。

const FULLNUM: [char; 10] = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];

// 項目として現れたら捨てる定型語
const ITEM_DROP_WORDS: [&str; 7] = [
    "その他",
    "丁目",
    "番地",
    "無番地",
    "全域",
    "番地のみ",
    "成田国際空港内",
];

// アイビスの個別判断と見られる例外: (base, 項目) → 捨てる
const ITEM_DROP_EXCEPTIONS: [(&str, &str); 5] = [
    ("寒川", "小川"),
    ("岩神町", "足助高等学校"),
    ("婦中町余川", "西余川"),
    ("婦中町余川", "東余川"),
    ("加茂町下津川", "奥津川"),
];

fn has_fullnum(s: &str) -> bool {
    s.chars().any(|c| FULLNUM.contains(&c))
}

fn is_katakana(s: &str) -> bool {
    !s.is_empty() && s.chars().all(|c| ('ァ'..='ヶ').contains(&c) || c == 'ー')
}

// 階（ビルの階層）: 全角数字のみ + 階
fn is_floor(content: &str) -> bool {
    match content.strip_suffix('階') {
        Some(rest) => !rest.is_empty() && rest.chars().all(|c| FULLNUM.contains(&c)),
        None => false,
    }
}

// 地割の範囲・列挙（例: 種市第１地割〜第２１地割、穴明２２地割、穴明２３地割）を
// 共通接頭辞に畳む。該当しなければ None。
// 正規表現 ^(.+?)(第?[０-９]+地割)([、〜].*地割.*)$ に相当（最左最短マッチ）
fn jiwari_fold(town: &str) -> Option<String> {
    let chars: Vec<char> = town.chars().collect();
    for start in 1..chars.len() {
        let mut i = start;
        if chars[i] == '第' {
            i += 1;
        }
        let num_start = i;
        while i < chars.len() && FULLNUM.contains(&chars[i]) {
            i += 1;
        }
        if i == num_start {
            continue;
        }
        if !(i + 1 < chars.len() && chars[i] == '地' && chars[i + 1] == '割') {
            continue;
        }
        let rest: String = chars[i + 2..].iter().collect();
        if (rest.starts_with('、') || rest.starts_with('〜')) && rest.contains("地割") {
            return Some(chars[..start].iter().collect());
        }
    }
    None
}

// 「…」の中の読点では区切らずに 、 で分割する
fn split_items(content: &str) -> Vec<String> {
    let mut items = Vec::new();
    let mut buf = String::new();
    let mut depth = 0;
    for ch in content.chars() {
        match ch {
            '「' => depth += 1,
            '」' => depth -= 1,
            _ => {}
        }
        if ch == '、' && depth == 0 {
            items.push(std::mem::take(&mut buf));
        } else {
            buf.push(ch);
        }
    }
    items.push(buf);
    items
}

// 項目を「…」注記のリストと、注記を除いた本体に分ける
fn brackets_of(item: &str) -> (Vec<String>, String) {
    let mut brackets = Vec::new();
    let mut outside = String::new();
    let mut inner = String::new();
    let mut depth = 0;
    for ch in item.chars() {
        if ch == '「' {
            depth += 1;
            if depth == 1 {
                continue;
            }
        }
        if ch == '」' {
            depth -= 1;
            if depth == 0 {
                brackets.push(std::mem::take(&mut inner));
                continue;
            }
        }
        if depth > 0 {
            inner.push(ch);
        } else {
            outside.push(ch);
        }
    }
    (brackets, outside)
}

// 列挙項目 → 出力する町域文字列。捨てる場合は None
fn item_to_row(item: &str, base: &str, kana_base: &str) -> Option<String> {
    // base（2文字以上）で始まる項目は冗長とみなして捨てる
    if base.chars().count() >= 2 && item.starts_with(base) {
        return None;
    }
    if ITEM_DROP_EXCEPTIONS.contains(&(base, item)) {
        return None;
    }
    let (brackets, outside) = brackets_of(item);
    for inner in &brackets {
        if inner.contains("を除く") || inner == "その他" || has_fullnum(inner) {
            return None;
        }
    }
    if ITEM_DROP_WORDS.contains(&outside.as_str()) {
        return None;
    }
    if outside.contains("を除く") || outside.contains("を含む") {
        return None;
    }
    if ["その他", "無番地", "地区", "住宅"]
        .iter()
        .any(|suf| outside.ends_with(suf))
    {
        return None;
    }
    if outside.contains('・') || outside.contains('○') {
        return None;
    }
    // カナ項目が base の読みの一部なら、読み仮名の注記とみなして捨てる
    if is_katakana(&outside) {
        let norm = outside.replace('ヲ', "オ");
        if kana_base.replace('ヲ', "オ").contains(&norm) {
            return None;
        }
    }
    if outside.ends_with('区') && !outside.contains('〜') {
        return Some(format!("{}{}", base, item));
    }
    if has_fullnum(&outside) {
        return None;
    }
    Some(format!("{}{}", base, item))
}

enum Transformed {
    // 定型句など: 空文字の町域 1 行だけを出す
    Empty,
    // ビルの階層: base 行は出さず、連結した行だけを出す
    Floor(String),
    // 通常: base 行（重複抑制の対象）+ 展開行
    Normal { base: String, extra: Vec<String> },
}

fn transform(town: &str, kana: &str) -> Result<Transformed, String> {
    let town = town.replace('−', "－"); // U+2212 MINUS SIGN → U+FF0D FULLWIDTH HYPHEN-MINUS

    // 定型句（括弧が付いていても、括弧の前の部分で判定する）
    let pre_paren = town.split('（').next().unwrap_or("");
    if town == "以下に掲載がない場合" {
        return Ok(Transformed::Empty);
    }
    if pre_paren.contains("の次に") && pre_paren.ends_with("がくる場合") {
        return Ok(Transformed::Empty);
    }
    if town.ends_with("一円") && town != "一円" {
        return Ok(Transformed::Empty);
    }

    let Some(start) = town.find('（') else {
        if let Some(folded) = jiwari_fold(&town) {
            return Ok(Transformed::Normal {
                base: folded,
                extra: vec![],
            });
        }
        return Ok(Transformed::Normal {
            base: town,
            extra: vec![],
        });
    };

    if !town.ends_with('）') {
        return Err(format!("括弧が閉じていない: {}", town));
    }
    let mut base = town[..start].to_string();
    let mut content = town[start + '（'.len_utf8()..town.len() - '）'.len_utf8()].to_string();
    // 二重括弧: 前の括弧は base に連結し、最後の括弧だけを処理する
    if let Some(last) = content.rfind('（') {
        let head = &content[..last];
        base.push_str(&head.replace('（', "").replace('）', ""));
        content = content[last + '（'.len_utf8()..].to_string();
        if content.contains('（') {
            return Err(format!("三重以上の括弧: {}", town));
        }
    }

    // 地割 base の畳み込み: 畳んだ場合は括弧内をすべて捨てる
    if let Some(folded) = jiwari_fold(&base) {
        return Ok(Transformed::Normal {
            base: folded,
            extra: vec![],
        });
    }
    // base 自体が列挙（甲、乙）の場合は空文字扱い
    if base.contains('、') {
        return Ok(Transformed::Empty);
    }

    if is_floor(&content) {
        return Ok(Transformed::Floor(format!("{}　{}", base, content)));
    }

    let kana_base = kana.split('（').next().unwrap_or("");
    let extra: Vec<String> = split_items(&content)
        .iter()
        .filter_map(|i| item_to_row(i, &base, kana_base))
        .collect();
    Ok(Transformed::Normal { base, extra })
}

fn main() {
    let path = "./utf_ken_all.csv";
    let data = match fs::read_to_string(path) {
        Ok(data) => data,
        Err(e) => {
            eprintln!("ファイル読み込みエラー ({}): {}", path, e);
            std::process::exit(1);
        }
    };
    println!("読み込みバイト数: {} bytes", data.len());

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .from_reader(data.as_bytes());

    // 上3桁 → 出力行のリスト（入力順を保持）
    let mut outputs: Vec<(String, Vec<String>)> = Vec::new();
    let mut index_of: HashMap<String, usize> = HashMap::new();
    // base を出力済みの (都道府県, 市区町村, base, 郵便番号, フラグ3列)。
    // 同じ組の2行目以降は、元データの複数行レコードの継続とみなして base 行を重複させない
    let mut seen: HashSet<(String, String, String, String, [String; 3])> = HashSet::new();

    let mut error_count = 0;
    let mut invalid_field_count = 0;
    let mut total_rows = 0;

    for result in reader.records() {
        let record = match result {
            Ok(r) => r,
            Err(e) => {
                eprintln!("CSV解析エラー: {}", e);
                error_count += 1;
                continue;
            }
        };
        let (Some(code), Some(kana), Some(pref), Some(city), Some(town)) = (
            record.get(2),
            record.get(5),
            record.get(6),
            record.get(7),
            record.get(8),
        ) else {
            eprintln!("列が不足している行: {:?}", record);
            error_count += 1;
            continue;
        };
        if code.len() != 7 {
            eprintln!("郵便番号が7桁でない行: {:?}", record);
            error_count += 1;
            continue;
        }
        let flags = [
            record.get(9).unwrap_or("").to_string(),
            record.get(10).unwrap_or("").to_string(),
            record.get(11).unwrap_or("").to_string(),
        ];

        let towns: Vec<String> = match transform(town, kana) {
            Ok(Transformed::Empty) => vec![String::new()],
            Ok(Transformed::Floor(row)) => vec![row],
            Ok(Transformed::Normal { base, extra }) => {
                let key = (
                    pref.to_string(),
                    city.to_string(),
                    base.clone(),
                    code.to_string(),
                    flags.clone(),
                );
                let mut rows = if seen.contains(&key) {
                    vec![]
                } else {
                    vec![base]
                };
                seen.insert(key);
                rows.extend(extra);
                rows
            }
            Err(e) => {
                eprintln!("変換エラー: {}", e);
                error_count += 1;
                continue;
            }
        };

        let (front, back) = code.split_at(3);
        for t in &towns {
            // クライアント（src/address.ts）は split(',') と " の全除去で解析するため、
            // フィールドに , と " が含まれないことがこの形式の前提
            for (name, value) in [("都道府県", pref), ("市区町村", city), ("町域", t.as_str())] {
                if value.contains(',') || value.contains('"') {
                    eprintln!("✗ {} に , または \" が含まれています: {}", name, value);
                    invalid_field_count += 1;
                }
            }
            let idx = *index_of.entry(front.to_string()).or_insert_with(|| {
                outputs.push((front.to_string(), Vec::new()));
                outputs.len() - 1
            });
            outputs[idx]
                .1
                .push(format!("\"{}\",\"{}\",\"{}\",\"{}\"\n", back, pref, city, t));
            total_rows += 1;
        }
    }

    if error_count > 0 || invalid_field_count > 0 {
        eprintln!(
            "\nエラー: 変換 {} 件、フィールド検査 {} 件。CSV を出力せずに終了します",
            error_count, invalid_field_count
        );
        std::process::exit(1);
    }

    println!("\n解析完了:");
    println!("生成されるファイル数: {}", outputs.len());
    println!("総行数: {}", total_rows);

    let output_dir = "../postalCode/csv";

    // マスターデータから消えた上3桁のファイルが残らないよう、既存のCSVを先に削除する
    if let Ok(entries) = fs::read_dir(output_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|e| e == "csv") {
                if let Err(e) = fs::remove_file(&path) {
                    eprintln!("✗ 既存ファイル削除エラー ({}): {}", path.display(), e);
                    std::process::exit(1);
                }
            }
        }
    }

    let mut success_count = 0;
    for (front, lines) in &outputs {
        let output_path = format!("{}/{}.csv", output_dir, front);
        match fs::File::create(&output_path) {
            Ok(mut file) => {
                if let Err(e) = file.write_all(lines.concat().as_bytes()) {
                    eprintln!("✗ ファイル書き込みエラー ({}): {}", output_path, e);
                    std::process::exit(1);
                }
                success_count += 1;
            }
            Err(e) => {
                eprintln!("✗ ファイル作成エラー ({}): {}", output_path, e);
                std::process::exit(1);
            }
        }
    }

    println!("\n出力完了:");
    println!("  ✓ 成功: {} ファイル", success_count);
}
