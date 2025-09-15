use std::fs;
use std::io::Write;
use std::collections::HashMap;
use encoding_rs::SHIFT_JIS;

#[derive(Debug)]
struct Address {
    post_code_back: String,  // 郵便番号の下4桁
    prefecture: String,      // 都道府県
    city: String,           // 市区町村
    town: String,           // 町域
}

fn main() {
    // マスターデータのパスを指定
    let path = "../generateCsv/master-data.csv";

    // ファイルを読み込み
    match fs::read(path) {
        Ok(data) => {
            println!("ファイル読み込み成功");
            println!("読み込みバイト数: {} bytes", data.len());

            // Shift-JISからUTF-8に変換
            let (text, _, had_errors) = SHIFT_JIS.decode(&data);

            if had_errors {
                eprintln!("警告: 文字コード変換でエラーが発生しました");
            }

            // CSVリーダーを作成（ヘッダーなし、最初の行もデータとして扱う）
            let mut reader = csv::ReaderBuilder::new()
                .has_headers(false)
                .from_reader(text.as_bytes());

            // 郵便番号の上3桁でグループ化するためのHashMap
            let mut dictionary: HashMap<String, Vec<Address>> = HashMap::new();

            // 各行を処理
            for result in reader.records() {
                match result {
                    Ok(record) => {
                        // 必要な列を取得
                        // 2列目: 郵便番号（7桁）
                        // 6列目: 都道府県
                        // 7列目: 市区町村
                        // 8列目: 町域
                        if let (Some(post_code), Some(prefecture), Some(city), Some(town)) =
                            (record.get(2), record.get(6), record.get(7), record.get(8)) {

                            // 郵便番号を上3桁と下4桁に分割
                            let post_code_clean = post_code.replace("\"", "");
                            if post_code_clean.len() == 7 {
                                let post_code_front = &post_code_clean[..3];
                                let post_code_back = &post_code_clean[3..];

                                let address = Address {
                                    post_code_back: post_code_back.to_string(),
                                    prefecture: prefecture.replace("\"", ""),
                                    city: city.replace("\"", ""),
                                    town: town.replace("\"", ""),
                                };

                                // 上3桁をキーとしてグループに追加
                                dictionary.entry(post_code_front.to_string())
                                    .or_insert_with(Vec::new)
                                    .push(address);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("CSV解析エラー: {}", e);
                    }
                }
            }

            println!("\n解析完了:");
            println!("生成されたファイル数: {}", dictionary.len());

            // 総アドレス数を確認
            let total_addresses: usize = dictionary.values().map(|v| v.len()).sum();
            println!("総アドレス数: {}", total_addresses);

            // 全CSVファイルを出力
            println!("\n全CSVファイルを出力中...");
            let output_dir = "../postalCode/csv";

            let mut success_count = 0;
            let mut error_count = 0;

            for (key, addresses) in dictionary.iter() {
                let output_path = format!("{}/{}.csv", output_dir, key);

                // CSV内容を生成
                let mut csv_content = String::new();
                for addr in addresses.iter() {
                    // TypeScript版と同じ形式で出力："下4桁","都道府県","市区町村","町域"
                    csv_content.push_str(&format!(
                        "\"{}\",\"{}\",\"{}\",\"{}\"\n",
                        addr.post_code_back,
                        addr.prefecture,
                        addr.city,
                        addr.town
                    ));
                }

                // ファイルに書き込み
                match fs::File::create(&output_path) {
                    Ok(mut file) => {
                        match file.write_all(csv_content.as_bytes()) {
                            Ok(_) => {
                                success_count += 1;
                                // 進捗表示（100ファイルごと）
                                if success_count % 100 == 0 {
                                    println!("  {} / {} ファイル出力完了", success_count, dictionary.len());
                                }
                            }
                            Err(e) => {
                                eprintln!("  ✗ ファイル書き込みエラー ({}): {}", output_path, e);
                                error_count += 1;
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("  ✗ ファイル作成エラー ({}): {}", output_path, e);
                        error_count += 1;
                    }
                }
            }

            println!("\n出力完了:");
            println!("  ✓ 成功: {} ファイル", success_count);
            if error_count > 0 {
                println!("  ✗ エラー: {} ファイル", error_count);
            }
        }
        Err(e) => {
            eprintln!("ファイル読み込みエラー: {}", e);
            eprintln!("パス: {}", path);
        }
    }
}
