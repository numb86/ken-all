///|
fn run_async(f : async () -> Unit noraise) -> Unit = "%async.run"

///|
async fn[T, E : Error] suspend(
  f : ((T) -> Unit, (E) -> Unit) -> Unit,
) -> T raise E = "%async.suspend"

///|
type Promise[T]

///|
type JsAny

///|
extern "js" fn is_string(v : JsAny) -> Bool =
  #|(v) => typeof v === 'string'

///|
extern "js" fn js_any_to_string(v : JsAny) -> String =
  #|(v) => v

///|
extern "js" fn js_search_fetch(
  url : String,
  on_ok : (String) -> Unit,
  on_not_found : () -> Unit,
  on_error : () -> Unit,
) -> Unit =
  #|(url, onOk, onNotFound, onError) => fetch(url, {mode: "cors"}).then(r => { if (r.status === 404 || r.status === 403) return onNotFound(); if (r.status >= 400) return onError(); return r.text().then(t => onOk(t || "")); }).catch(() => onError())

///|
extern "js" fn make_promise_with_run_and_reject(
  runner : ((Array[Array[String]]) -> Unit, (String) -> Unit) -> Unit,
) -> Promise[Array[Array[String]]] =
  #|(runner) => new Promise((resolve, reject) => runner(resolve, (msg) => reject(new Error(msg))))

///|
async fn search_internal(postal_code : String) -> Array[Array[String]] {
  let prefix = postal_code[:3].to_string()
  let back = postal_code[3:].to_string()
  let url = "https://ken-all.numb86.net/csv/" + prefix + ".csv"
  let result : (String, Bool, Bool) = suspend(fn(resume_ok, _resume_err) {
    js_search_fetch(
      url,
      fn(t) { resume_ok((t, false, false)) |> ignore },
      fn() { resume_ok(("", true, false)) |> ignore },
      fn() { resume_ok(("", false, true)) |> ignore },
    )
  })
  let text = result.0
  let is_not_found = result.1
  let is_error = result.2
  if is_not_found {
    return []
  }
  if is_error {
    fail("Network error.")
  }
  let addresses = parse_csv(text)
  let filtered = extract_target_address(back, addresses)
  normalize_address_list(filtered)
}

///|
pub fn search(postal_code : JsAny) -> Promise[Array[Array[String]]] {
  make_promise_with_run_and_reject(fn(resolve, reject) {
    if not(is_string(postal_code)) {
      reject("The argument must be a string.")
      return
    }
    let postal_code_str = js_any_to_string(postal_code)
    if not(is_valid_postal_code(postal_code_str)) {
      reject("The post code is always seven digits half-width numbers.")
      return
    }
    run_async(fn() {
      try {
        let result = search_internal(postal_code_str)
        resolve(result)
      } catch {
        _ => reject("Network error.")
      }
    })
  })
}
