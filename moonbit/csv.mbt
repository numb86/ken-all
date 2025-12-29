///|
fn is_valid_postal_code(s : String) -> Bool {
  if s.length() != 7 {
    return false
  }
  for c in s {
    if c < '0' || c > '9' {
      return false
    }
  }
  true
}

///|
fn remove_quotes(s : String) -> String {
  let result : Array[Char] = []
  for c in s {
    if c != '"' {
      result.push(c)
    }
  }
  String::from_array(result)
}

///|
fn parse_line(line : String) -> Array[String] raise {
  let parts = line
    .split(",")
    .map(fn(s) { remove_quotes(s.to_string()) })
    .collect()
  if parts.length() != 4 {
    fail("CSV was broken.")
  }
  parts
}

///|
fn parse_csv(raw_data : String) -> Array[Array[String]] raise {
  let result : Array[Array[String]] = []
  for line in raw_data.split("\n") {
    let line_str = line.to_string()
    if line_str.length() > 0 {
      result.push(parse_line(line_str))
    }
  }
  result
}

///|
fn extract_target_address(
  post_code_back : String,
  address_list : Array[Array[String]],
) -> Array[Array[String]] {
  address_list.filter(fn(address) { address[0] == post_code_back })
}

///|
fn normalize_address(address : Array[String]) -> Array[String] {
  [address[1], address[2], address[3]]
}

///|
fn normalize_address_list(
  address_list : Array[Array[String]],
) -> Array[Array[String]] {
  address_list.map(normalize_address)
}

// ========================================
// テスト
// ========================================

// remove_quotes

///|
test "remove_quotes: removes double quotes" {
  assert_eq(remove_quotes("\"hello\""), "hello")
}

///|
test "remove_quotes: no quotes" {
  assert_eq(remove_quotes("hello"), "hello")
}

///|
test "remove_quotes: empty string" {
  assert_eq(remove_quotes(""), "")
}

///|
test "remove_quotes: only quotes" {
  assert_eq(remove_quotes("\"\""), "")
}

///|
test "remove_quotes: quotes in middle" {
  assert_eq(remove_quotes("hel\"lo"), "hello")
}

// parse_line

///|
test "parse_line: valid line" {
  let result = parse_line(
    "\"0004\",\"東京都\",\"千代田区\",\"大手町\"",
  )
  assert_eq(result.length(), 4)
  assert_eq(result[0], "0004")
  assert_eq(result[1], "東京都")
  assert_eq(result[2], "千代田区")
  assert_eq(result[3], "大手町")
}

///|
test "parse_line: empty town area" {
  let result = parse_line("\"0000\",\"愛知県\",\"弥富市\",\"\"")
  assert_eq(result[3], "")
}

///|
test "panic parse_line: too few columns" {
  let _ = parse_line("\"0004\",\"東京都\",\"千代田区\"")

}

///|
test "panic parse_line: too many columns" {
  let _ = parse_line(
    "\"0004\",\"東京都\",\"千代田区\",\"大手町\",\"extra\"",
  )

}
// parse_csv

///|
test "parse_csv: single line" {
  let csv = "\"0004\",\"東京都\",\"千代田区\",\"大手町\""
  let result = parse_csv(csv)
  assert_eq(result.length(), 1)
  assert_eq(result[0][0], "0004")
}

///|
test "parse_csv: multiple lines" {
  let csv = "\"0004\",\"東京都\",\"千代田区\",\"大手町\"\n\"0005\",\"東京都\",\"千代田区\",\"丸の内\""
  let result = parse_csv(csv)
  assert_eq(result.length(), 2)
  assert_eq(result[0][3], "大手町")
  assert_eq(result[1][3], "丸の内")
}

///|
test "parse_csv: empty string" {
  let result = parse_csv("")
  assert_eq(result.length(), 0)
}

///|
test "parse_csv: trailing newline" {
  let csv = "\"0004\",\"東京都\",\"千代田区\",\"大手町\"\n"
  let result = parse_csv(csv)
  assert_eq(result.length(), 1)
}

// extract_target_address

///|
test "extract_target_address: single match" {
  let address_list = [
    ["0004", "東京都", "千代田区", "大手町"],
    ["0005", "東京都", "千代田区", "丸の内"],
  ]
  let result = extract_target_address("0004", address_list)
  assert_eq(result.length(), 1)
  assert_eq(result[0][3], "大手町")
}

///|
test "extract_target_address: multiple matches" {
  let address_list = [
    ["0000", "愛知県", "弥富市", ""],
    ["0000", "三重県", "桑名郡木曽岬町", ""],
  ]
  let result = extract_target_address("0000", address_list)
  assert_eq(result.length(), 2)
}

///|
test "extract_target_address: no match" {
  let address_list = [["0004", "東京都", "千代田区", "大手町"]]
  let result = extract_target_address("9999", address_list)
  assert_eq(result.length(), 0)
}

///|
test "extract_target_address: empty list" {
  let address_list : Array[Array[String]] = []
  let result = extract_target_address("0004", address_list)
  assert_eq(result.length(), 0)
}

// normalize_address

///|
test "normalize_address: removes postal code suffix" {
  let address = ["0004", "東京都", "千代田区", "大手町"]
  let result = normalize_address(address)
  assert_eq(result.length(), 3)
  assert_eq(result[0], "東京都")
  assert_eq(result[1], "千代田区")
  assert_eq(result[2], "大手町")
}

// normalize_address_list

///|
test "normalize_address_list: multiple addresses" {
  let address_list = [
    ["0004", "東京都", "千代田区", "大手町"],
    ["0005", "東京都", "千代田区", "丸の内"],
  ]
  let result = normalize_address_list(address_list)
  assert_eq(result.length(), 2)
  assert_eq(result[0][0], "東京都")
  assert_eq(result[1][2], "丸の内")
}

///|
test "normalize_address_list: empty list" {
  let address_list : Array[Array[String]] = []
  let result = normalize_address_list(address_list)
  assert_eq(result.length(), 0)
}

// is_valid_postal_code

///|
test "is_valid_postal_code: valid 7 digits" {
  assert_eq(is_valid_postal_code("1000004"), true)
}

///|
test "is_valid_postal_code: valid 7 digits starting with zero" {
  assert_eq(is_valid_postal_code("0010001"), true)
}

///|
test "is_valid_postal_code: too short" {
  assert_eq(is_valid_postal_code("100000"), false)
}

///|
test "is_valid_postal_code: too long" {
  assert_eq(is_valid_postal_code("10000040"), false)
}

///|
test "is_valid_postal_code: empty" {
  assert_eq(is_valid_postal_code(""), false)
}

///|
test "is_valid_postal_code: contains letter" {
  assert_eq(is_valid_postal_code("100000a"), false)
}

///|
test "is_valid_postal_code: contains hyphen" {
  assert_eq(is_valid_postal_code("100-0004"), false)
}

///|
test "is_valid_postal_code: full-width numbers" {
  assert_eq(is_valid_postal_code("１２３４５６７"), false)
}

///|
test "is_valid_postal_code: all zeros" {
  assert_eq(is_valid_postal_code("0000000"), true)
}

///|
test "is_valid_postal_code: all nines" {
  assert_eq(is_valid_postal_code("9999999"), true)
}
