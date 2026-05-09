# 香港政府API网址应用

## 📋 系统使用的政府API

### **1. 历史档案API**

- **API端点**: `https://app.data.gov.hk/v1/historical-archive/list-files`
- **用途**: 获取香港政府历史数据文件
- **搜索部门**:
  - 政府新闻处 (hk-isd)
  - 劳工处 (hk-ld)
  - 发展局 (hk-devb)



## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

* ### 下載歷史數據應用程式介面
* ### 數據篩選應用程式介面
* ### 尋找附近設施應用程式介面

[1. 歷史資料庫文件列表API](https://data.gov.hk/tc/help/api-spec#collapse-0)

**API端點**

https://app.data.gov.hk/v1/historical-archive/list-files

HTTP請求方法： GET
取回在 `start`和 `end`指定日期以內並符合 `category`，`provider`和 `format`參數的檔案清單。

每次最多有 `max`數目的結果返回，首 `skip`數目的結果會被略去。利用這兩個參數可達到分頁用途。

如果是一個成功的呼叫，JSON格式的檔案清單和結果總計將會隨著狀態碼 `200` 返回。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。

| 參數                                      | 描述                                                            | 必要       |
| ----------------------------------------- | --------------------------------------------------------------- | ---------- |
| start                                     | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是         |
| end                                       | 以 `YYYYMMDD`格式的結束日期（包括尾日）, *例如: 20161231。* | 是         |
| category                                  | 類別識別碼,*例如: information-technology-and-broadcasting* 。 | 類別識別碼 |
| ----------------------------------------- | ----------------------                                          |            |
| city-management                           | 城市管理及公共設施                                              |            |
| climate-and-weather                       | 氣象                                                            |            |
| commerce-and-industry                     | 工商業                                                          |            |
| social-welfare                            | 社區及社會福利                                                  |            |
| development                               | 發展、地理及土地資訊                                            |            |
| education                                 | 教育                                                            |            |
| legislature                               | 選舉及立法機關                                                  |            |
| employment-and-labour                     | 就業及勞工                                                      |            |
| environment                               | 環境                                                            |            |
| finance                                   | 財經                                                            |            |
| food                                      | 食物                                                            |            |
| health                                    | 衞生                                                            |            |
| housing                                   | 房屋                                                            |            |
| law-and-security                          | 法律及保安                                                      |            |
| population                                | 人口                                                            |            |
| recreation-and-culture                    | 康樂、體育及文化                                                |            |
| information-technology-and-broadcasting   | 科技及廣播                                                      |            |
| tourism                                   | 旅遊                                                            |            |
| transport                                 | 運輸                                                            |            |
| miscellaneous                             | 其他                                                            |            |

    | 否   |
| provider | 數據提供機構識別碼,*例如: hk-dpo* 。`<br/>` **數據提供機構識別碼 的完整列表如下:** | 數據提供機構識別碼 | 數據提供機構名稱                                 |
| -------------------- | -------------------------------------------------- |
| aahk               | 香港機場管理局                                   |
| cc                 | 消費者委員會                                     |
| centaline          | 中原地產代理有限公司                             |
| cfs                | 食物安全中心                                     |
| chsc               | 家庭與學校合作事宜委員會                         |
| ckf                | 全記渡有限公司                                   |
| clp                | 中華電力有限公司                                 |
| compcomm           | 競爭事務委員會                                   |
| ctb                | 城巴有限公司                                     |
| cyberport          | 香港數碼港管理有限公司                           |
| dc                 | 區議會                                           |
| eac                | 選舉管理委員會                                   |
| ff                 | 富裕小輪有限公司                                 |
| hk-afcd            | 漁農自然護理署                                   |
| hk-ams             | 醫療輔助隊                                       |
| hk-archsd          | 建築署                                           |
| hk-aud             | 審計署                                           |
| hk-aw              | 政務司司長辦公室轄下行政署                       |
| hk-bd              | 屋宇署                                           |
| hk-cad             | 民航處                                           |
| hk-cas             | 民眾安全服務隊                                   |
| hk-cedb            | 商務及經濟發展局                                 |
| hk-cedd            | 土木工程拓展署                                   |
| hk-censtatd        | 政府統計處                                       |
| hk-ceo             | 行政長官辦公室                                   |
| hk-cmab            | 政制及內地事務局                                 |
| hk-cpu             | 中央政策組                                       |
| hk-cepu            | 特首政策组                                       |
| hk-cr              | 公司註冊處                                       |
| hk-csb             | 公務員事務局                                     |
| hk-csd             | 香港懲教署                                       |
| hk-cso             | 政務司司長辦公室                                 |
| hk-cstb            | 文化體育及旅遊局                                 |
| hk-customs         | 香港海關                                         |
| hk-devb            | 發展局                                           |
| hk-dh              | 衞生署                                           |
| hk-doj             | 律政司                                           |
| hk-dpo             | 數字政策辦公室                                   |
| hk-dsd             | 渠務署                                           |
| hk-eabfu           | 經濟分析及方便營商處                             |
| hk-edb             | 教育局                                           |
| hk-eeb             | 環境及生態局                                     |
| hk-emsd            | 機電工程署                                       |
| hk-epd             | 環境保護署                                       |
| hk-fehd            | 食物環境衞生署                                   |
| hk-fsd             | 香港消防處                                       |
| hk-fso             | 財政司司長辦公室                                 |
| hk-fstb            | 財經事務及庫務局                                 |
| hk-gfs             | 政府飛行服務隊                                   |
| hk-gld             | 政府物流服務署                                   |
| hk-govtlab         | 政府化驗所                                       |
| hk-gpa             | 政府產業署                                       |
| hk-had             | 民政事務總署                                     |
| hk-hb              | 房屋局                                           |
| hk-hhb             | 醫務衞生局                                       |
| hk-hkma            | 香港金融管理局                                   |
| hk-hko             | 香港天文台                                       |
| hk-hkpf            | 香港警務處                                       |
| hk-hkpo            | 香港郵政                                         |
| hk-housing         | 香港房屋委員會                                   |
| hk-hyab            | 民政及青年事務局                                 |
| hk-hyd             | 路政署                                           |
| hk-icac            | 廉政公署                                         |
| hk-immd            | 入境事務處                                       |
| hk-investhk        | 投資推廣署                                       |
| hk-ipd             | 知識產權署                                       |
| hk-ird             | 稅務局                                           |
| hk-isd             | 政府新聞處                                       |
| hk-itc             | 創新科技署                                       |
| hk-itib            | 創新科技及工業局                                 |
| hk-jsscs           | 公務及司法人員薪俸及服務條件諮詢委員會聯合秘書處 |
| hk-lad             | 法律援助署                                       |
| hk-landsd          | 地政總署                                         |
| hk-lcsd            | 康樂及文化事務署                                 |
| hk-ld              | 勞工處                                           |
| hk-lr              | 土地註冊處                                       |
| hk-lwb             | 勞工及福利局                                     |
| hk-md              | 海事處                                           |
| hk-ofca            | 通訊事務管理局辦公室                             |
| hk-ofnaa           | 電影、報刊及物品管理辦事處                       |
| hk-omb             | 申訴專員公署                                     |
| hk-oro             | 破產管理署                                       |
| hk-pland           | 規劃署                                           |
| hk-psc             | 公務員敍用委員會                                 |
| hk-reo             | 選舉事務處                                       |
| hk-rthk            | 香港電台                                         |
| hk-rvd             | 差餉物業估價署                                   |
| hk-sb              | 保安局                                           |
| hk-sciocs          | 截取通訊及監察事務專員秘書處                     |
| hk-swd             | 社會福利署                                       |
| hk-td              | 運輸署                                           |
| hk-tid             | 工業貿易署                                       |
| hk-tlb             | 運輸及物流局                                     |
| hk-try             | 庫務署                                           |
| hk-ugc             | 大學教育資助委員會秘書處                         |
| hk-wfsfaa          | 在職家庭及學生資助事務處                         |
| hk-wsd             | 水務署                                           |
| hkcaavq            | 香港學術及職業資歷評審局                         |
| hkcert             | 香港網絡安全事故協調中心                         |
| hkeaa              | 香港考試及評核局                                 |
| hkelectric         | 香港電燈有限公司                                 |
| hkhs               | 香港房屋協會                                     |
| hkirc              | 香港互聯網註冊管理有限公司                       |
| hkkf               | 港九小輪有限公司                                 |
| hkpc               | 香港生產力促進局                                 |
| hkstp              | 香港科技園公司                                   |
| hktdc              | 香港貿易發展局                                   |
| hktramways         | 香港電車有限公司                                 |
| hospital           | 醫院管理局                                       |
| ia                 | 保險業監管局                                     |
| legco              | 立法會                                           |
| llb                | 酒牌局                                           |
| mpfa               | 強制性公積金計劃管理局                           |
| mtr                | 香港鐵路有限公司                                 |
| nlb                | 新大嶼山巴士 (1973) 有限公司                     |
| pckt               | 坪洲街渡有限公司                                 |
| rehabsociety       | 香港復康會                                       |
| starferry          | 天星小輪有限公司                                 |
| sunferry           | 新渡輪服務有限公司                               |
| towngas            | 香港中華煤氣有限公司                             |
| tpd                | 城市規劃委員會                                   |
| traway             | 翠華船務(香港)有限公司                           |
| ura                | 市區重建局                                       |
| wkcda              | 西九文化區管理局                                 |
| 28hse              | 28地產資訊有限公司                               |

 | No   |
| format   | 檔案格式，以檔案的副檔名， *例如: xls* 。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 否   |
| search   | 關鍵詞搜尋。只有與數據集／資源名稱匹配的結果會返回。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 否   |
| order    | 排序。 有效選項為: `dataset-en`，`dataset-tc`，`dataset-sc`，`resource-en`，`resource-tc`，`resource-sc` 和 `url`。預設排序為 `url`。.`<br/><br/>`-en/-tc/-sc 後綴表示用於排序的相應語言。`<br/><br/>`結果可以按如下排序：1. 數據集和資源名稱 - 如 `order`是按 `dataset-en`，`dataset-tc` 或 `dataset-sc`。1. 資源名稱 - 如 `order`是按 `resource-en`, `resource-tc` or `resource-sc`。1. 網址 - 如 `order`是按 `url`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 否   |
| skip     | 首*x*個記錄會被省略。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 否   |

[2. 歷史存檔文件版本API](https://data.gov.hk/tc/help/api-spec#collapse-1)

**API端點**

https://app.data.gov.hk/v1/historical-archive/list-file-versions

**HTTP請求方法： GET**

取回在日期（`start` 和 `end`中提供）以內的檔案（`url`中提供）的歷史版本清單。
只有首*10,000*個結果將會返回。

如果是一個成功的呼叫，JSON格式的歷史版本時間戳清單，結果總計和字節總大小將會隨著狀態碼 `200` 返回。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。

| 參數  | 描述                                                            | 必要 |
| ----- | --------------------------------------------------------------- | ---- |
| url   | 檔案網址，網址可從歷史檔案文件列表應用程式介面結果中找到。      | 是   |
| start | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是   |
| end   | 以 `YYYYMMDD`格式的結束日期（包括尾日）, *例如: 20161231。* | 是   |

[3. 歷史存檔文件下載API](https://data.gov.hk/tc/help/api-spec#collapse-2)

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-file

**HTTP請求方法： GET**

取回基於 `time`的檔案（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 參數                                                            | 必要 |
| ---- | --------------------------------------------------------------- | ---- |
| url  | 檔案網址，網址可從歷史檔案文件列表應用程式介面結果中找到。      | 是   |
| time | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是   |

補充資訊:

* 所有時間均以GMT + 8時區為準。
* 最新的歷史數據來自昨天。

[4. 歷史存檔模式下載API](https://data.gov.hk/tc/help/api-spec#collapse-3)

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-schema

取回基於 `date`的模式（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 描述                                              | 必要 |
| ---- | ------------------------------------------------- | ---- |
| url  | 數據集的網址                                      | 是   |
| date | 以 `YYYYMMDD`格式的日期,  *例如: 20160101* 。 | 是   |

[5. 歷史存檔數據字典API](https://data.gov.hk/tc/help/api-spec#collapse-4)

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-data-dictionary

取回基於 `date`的數據字典（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 描述                                              | 必要 |
| ---- | ------------------------------------------------- | ---- |
| url  | 數據集的網址                                      | 是   |
| date | 以 `YYYYMMDD`格式的日期,  *例如: 20160101* 。 | 是   |

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。

## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

* ### 下載歷史數據應用程式介面
* ### 數據篩選應用程式介面
* ### 尋找附近設施應用程式介面

[1. 歷史資料庫文件列表API](https://data.gov.hk/tc/help/api-spec#collapse-0)

**API端點**

https://app.data.gov.hk/v1/historical-archive/list-files

HTTP請求方法： GET
取回在 `start`和 `end`指定日期以內並符合 `category`，`provider`和 `format`參數的檔案清單。

每次最多有 `max`數目的結果返回，首 `skip`數目的結果會被略去。利用這兩個參數可達到分頁用途。

如果是一個成功的呼叫，JSON格式的檔案清單和結果總計將會隨著狀態碼 `200` 返回。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。

| 參數                                      | 描述                                                            | 必要       |
| ----------------------------------------- | --------------------------------------------------------------- | ---------- |
| start                                     | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是         |
| end                                       | 以 `YYYYMMDD`格式的結束日期（包括尾日）, *例如: 20161231。* | 是         |
| category                                  | 類別識別碼,*例如: information-technology-and-broadcasting* 。 | 類別識別碼 |
| ----------------------------------------- | ----------------------                                          |            |
| city-management                           | 城市管理及公共設施                                              |            |
| climate-and-weather                       | 氣象                                                            |            |
| commerce-and-industry                     | 工商業                                                          |            |
| social-welfare                            | 社區及社會福利                                                  |            |
| development                               | 發展、地理及土地資訊                                            |            |
| education                                 | 教育                                                            |            |
| legislature                               | 選舉及立法機關                                                  |            |
| employment-and-labour                     | 就業及勞工                                                      |            |
| environment                               | 環境                                                            |            |
| finance                                   | 財經                                                            |            |
| food                                      | 食物                                                            |            |
| health                                    | 衞生                                                            |            |
| housing                                   | 房屋                                                            |            |
| law-and-security                          | 法律及保安                                                      |            |
| population                                | 人口                                                            |            |
| recreation-and-culture                    | 康樂、體育及文化                                                |            |
| information-technology-and-broadcasting   | 科技及廣播                                                      |            |
| tourism                                   | 旅遊                                                            |            |
| transport                                 | 運輸                                                            |            |
| miscellaneous                             | 其他                                                            |            |

    | 否   |
| provider | 數據提供機構識別碼,*例如: hk-dpo* 。`<br/>` **數據提供機構識別碼 的完整列表如下:** | 數據提供機構識別碼 | 數據提供機構名稱                                 |
| -------------------- | -------------------------------------------------- |
| aahk               | 香港機場管理局                                   |
| cc                 | 消費者委員會                                     |
| centaline          | 中原地產代理有限公司                             |
| cfs                | 食物安全中心                                     |
| chsc               | 家庭與學校合作事宜委員會                         |
| ckf                | 全記渡有限公司                                   |
| clp                | 中華電力有限公司                                 |
| compcomm           | 競爭事務委員會                                   |
| ctb                | 城巴有限公司                                     |
| cyberport          | 香港數碼港管理有限公司                           |
| dc                 | 區議會                                           |
| eac                | 選舉管理委員會                                   |
| ff                 | 富裕小輪有限公司                                 |
| hk-afcd            | 漁農自然護理署                                   |
| hk-ams             | 醫療輔助隊                                       |
| hk-archsd          | 建築署                                           |
| hk-aud             | 審計署                                           |
| hk-aw              | 政務司司長辦公室轄下行政署                       |
| hk-bd              | 屋宇署                                           |
| hk-cad             | 民航處                                           |
| hk-cas             | 民眾安全服務隊                                   |
| hk-cedb            | 商務及經濟發展局                                 |
| hk-cedd            | 土木工程拓展署                                   |
| hk-censtatd        | 政府統計處                                       |
| hk-ceo             | 行政長官辦公室                                   |
| hk-cmab            | 政制及內地事務局                                 |
| hk-cpu             | 中央政策組                                       |
| hk-cepu            | 特首政策组                                       |
| hk-cr              | 公司註冊處                                       |
| hk-csb             | 公務員事務局                                     |
| hk-csd             | 香港懲教署                                       |
| hk-cso             | 政務司司長辦公室                                 |
| hk-cstb            | 文化體育及旅遊局                                 |
| hk-customs         | 香港海關                                         |
| hk-devb            | 發展局                                           |
| hk-dh              | 衞生署                                           |
| hk-doj             | 律政司                                           |
| hk-dpo             | 數字政策辦公室                                   |
| hk-dsd             | 渠務署                                           |
| hk-eabfu           | 經濟分析及方便營商處                             |
| hk-edb             | 教育局                                           |
| hk-eeb             | 環境及生態局                                     |
| hk-emsd            | 機電工程署                                       |
| hk-epd             | 環境保護署                                       |
| hk-fehd            | 食物環境衞生署                                   |
| hk-fsd             | 香港消防處                                       |
| hk-fso             | 財政司司長辦公室                                 |
| hk-fstb            | 財經事務及庫務局                                 |
| hk-gfs             | 政府飛行服務隊                                   |
| hk-gld             | 政府物流服務署                                   |
| hk-govtlab         | 政府化驗所                                       |
| hk-gpa             | 政府產業署                                       |
| hk-had             | 民政事務總署                                     |
| hk-hb              | 房屋局                                           |
| hk-hhb             | 醫務衞生局                                       |
| hk-hkma            | 香港金融管理局                                   |
| hk-hko             | 香港天文台                                       |
| hk-hkpf            | 香港警務處                                       |
| hk-hkpo            | 香港郵政                                         |
| hk-housing         | 香港房屋委員會                                   |
| hk-hyab            | 民政及青年事務局                                 |
| hk-hyd             | 路政署                                           |
| hk-icac            | 廉政公署                                         |
| hk-immd            | 入境事務處                                       |
| hk-investhk        | 投資推廣署                                       |
| hk-ipd             | 知識產權署                                       |
| hk-ird             | 稅務局                                           |
| hk-isd             | 政府新聞處                                       |
| hk-itc             | 創新科技署                                       |
| hk-itib            | 創新科技及工業局                                 |
| hk-jsscs           | 公務及司法人員薪俸及服務條件諮詢委員會聯合秘書處 |
| hk-lad             | 法律援助署                                       |
| hk-landsd          | 地政總署                                         |
| hk-lcsd            | 康樂及文化事務署                                 |
| hk-ld              | 勞工處                                           |
| hk-lr              | 土地註冊處                                       |
| hk-lwb             | 勞工及福利局                                     |
| hk-md              | 海事處                                           |
| hk-ofca            | 通訊事務管理局辦公室                             |
| hk-ofnaa           | 電影、報刊及物品管理辦事處                       |
| hk-omb             | 申訴專員公署                                     |
| hk-oro             | 破產管理署                                       |
| hk-pland           | 規劃署                                           |
| hk-psc             | 公務員敍用委員會                                 |
| hk-reo             | 選舉事務處                                       |
| hk-rthk            | 香港電台                                         |
| hk-rvd             | 差餉物業估價署                                   |
| hk-sb              | 保安局                                           |
| hk-sciocs          | 截取通訊及監察事務專員秘書處                     |
| hk-swd             | 社會福利署                                       |
| hk-td              | 運輸署                                           |
| hk-tid             | 工業貿易署                                       |
| hk-tlb             | 運輸及物流局                                     |
| hk-try             | 庫務署                                           |
| hk-ugc             | 大學教育資助委員會秘書處                         |
| hk-wfsfaa          | 在職家庭及學生資助事務處                         |
| hk-wsd             | 水務署                                           |
| hkcaavq            | 香港學術及職業資歷評審局                         |
| hkcert             | 香港網絡安全事故協調中心                         |
| hkeaa              | 香港考試及評核局                                 |
| hkelectric         | 香港電燈有限公司                                 |
| hkhs               | 香港房屋協會                                     |
| hkirc              | 香港互聯網註冊管理有限公司                       |
| hkkf               | 港九小輪有限公司                                 |
| hkpc               | 香港生產力促進局                                 |
| hkstp              | 香港科技園公司                                   |
| hktdc              | 香港貿易發展局                                   |
| hktramways         | 香港電車有限公司                                 |
| hospital           | 醫院管理局                                       |
| ia                 | 保險業監管局                                     |
| legco              | 立法會                                           |
| llb                | 酒牌局                                           |
| mpfa               | 強制性公積金計劃管理局                           |
| mtr                | 香港鐵路有限公司                                 |
| nlb                | 新大嶼山巴士 (1973) 有限公司                     |
| pckt               | 坪洲街渡有限公司                                 |
| rehabsociety       | 香港復康會                                       |
| starferry          | 天星小輪有限公司                                 |
| sunferry           | 新渡輪服務有限公司                               |
| towngas            | 香港中華煤氣有限公司                             |
| tpd                | 城市規劃委員會                                   |
| traway             | 翠華船務(香港)有限公司                           |
| ura                | 市區重建局                                       |
| wkcda              | 西九文化區管理局                                 |
| 28hse              | 28地產資訊有限公司                               |

| No   |
| format   | 檔案格式，以檔案的副檔名， 例如: xls 。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 否   |
| search   | 關鍵詞搜尋。只有與數據集／資源名稱匹配的結果會返回。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 否   |
| order    | 排序。 有效選項為: dataset-en，dataset-tc，dataset-sc，resource-en，resource-tc，resource-sc 和 url。預設排序為 url。.

-en/-tc/-sc 後綴表示用於排序的相應語言。

結果可以按如下排序：1. 數據集和資源名稱 - 如 order是按 dataset-en，dataset-tc 或 dataset-sc。1. 資源名稱 - 如 order是按 resource-en, resource-tc or resource-sc。1. 網址 - 如 order是按 url。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 否   |

| skip | 首x個記錄會被省略。 | 否 |  |  |  |  |  |  |  |  |  |  |  |  |  |              |
| ---- | ------------------- | -- | - | - | - | - | - | - | - | - | - | - | - | - | - | ------------ |
|      |                     |    |  |  |  |  |  |  |  |  |  |  |  |  |  | <br /><br /> |

[2. 歷史存檔文件版本API](https://data.gov.hk/tc/help/api-spec#collapse-1)


## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

數據篩選應用程式介面

**例子:
數據集: 放債人牌照**

**數據資源: 現有放債人牌照持牌人名單**
URL: [http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv](http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv)

**API端點**

https://api.data.gov.hk/v2/filter

注意：本應用程式介面最新版本為2，我們仍然支援版本1。

本應用程式介面接受查詢字串輸入。

**輸入**

**查詢字串輸入參數**

| 名稱 | 值說明                                                            | 必要 |
| ---- | ----------------------------------------------------------------- | ---- |
| q    | 網址編碼(URL-Encoded) JSON 物件字串(有關詳細信息，請參閱以下描述) | 是   |

**給查詢字串參數 "q" 的 JSON 物件字串規格**

| 成員/名字 | JSON 數據類型 | 值說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 必要 |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| resource  | string        | URL資源. URL可以在本頁的頂部找到                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 是   |
| section   | number        | 章節編號（僅在"數據部分"可用時才需要）* 由1開始的正整數 (預設: 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 否   |
| filter    | array         | 篩選條件的數據陣列：[ [F1], [F2], ..., [Fn] ]F 為篩選條件。篩選條件數據陣列中每一個篩選條件皆為數據陣列，當中包含三個JSON元素，如下：Fn = [ Cn, "OP", [ "O1", "O2", ..., "On" ] ]Cn 為欄位編號(number)``OP 為篩選條件運算符(string)，以下列表為目前所支持的篩選條件運算符：**eq** - 等於``**ne** - 不等於``**in** - 在...之內 (只限文字)``**ni** - 不在...之內 (只限文字)``**lt** - 小於 (只限數字)``**le** - 小於或等於 (只限數字)``**gt** - 大於 (只限數字)``**ge** - 大於或等於 (只限數字)``**bt** - 在...之間 (只限數字)``**ct** - 包含 (只限文字)``**nct** - 不包含 (只限文字)``**bw** - 以...開始 (只限文字)``**nbw** - 不以...開始 (只限文字)``**ew** - 以...結束 (只限文字)``**new** - 不以...結束 (只限文字)在 [ "O1", "O2", ..., "On" ] 數據陣列中，O (string) 為篩選條件操作數。當篩選條件運算符 OP 為 bw （在...之間）時，必需提供兩個篩選條件操作數。當篩選條件運算符 OP 為 in （在...之內） 或 ni（不在...之內）時，必需提供兩個或更多的篩選條件操作數。其餘的篩選條件運算符只需提供一個篩選條件操作數。 | 否   |
| sorts     | array         | 排序條件的數據陣列：``[ [S1], [S2], ..., [Sn] ]S 為排序條件。排序條件數據陣列中每一個排序條件皆為數據陣列，當中包含兩個JSON元素，如下：Sn = [ Cn, "ORDER" ]Cn 為欄位編號(number)``ORDER 為排序條件(string), 以下為可選的排序條件值：asc - 升序``desc - 降序                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 否   |
| format    | string        | 輸出格式:CSV (預設)``json``xml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 否   |

**例子**

輸入

resource = https://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv

section = 1,

篩選條件及排序條件為：

欄位編號 1 中，其值等於 “3983” 和，

欄位編號 2 中，其值不包含 “2021”和，

欄位編號 4 ，排序為升序 和，

欄位編號 7 ，排序為降序

format（輸出格式）= JSON,

JSON 物件

```
{
	"resource":"http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv",
	"section":1,
	"format":"json",
	"sorts":[
		[4,"asc"],[7,"desc"]
	],
	"filters":[
		[1,"eq",["3983"]],[2,"nct",["2021"]]
	]
}
                  
```

**輸出 [JSON 物件]**

根據"format"參數的CSV、JSON或XML檔案 以上為 JSON 物件字串

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。

**API端點**

https://app.data.gov.hk/v1/historical-archive/list-file-versions

**HTTP請求方法： GET**

取回在日期（`start` 和 `end`中提供）以內的檔案（`url`中提供）的歷史版本清單。
只有首*10,000*個結果將會返回。

如果是一個成功的呼叫，JSON格式的歷史版本時間戳清單，結果總計和字節總大小將會隨著狀態碼 `200` 返回。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。

| 參數  | 描述                                                            | 必要 |
| ----- | --------------------------------------------------------------- | ---- |
| url   | 檔案網址，網址可從歷史檔案文件列表應用程式介面結果中找到。      | 是   |
| start | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是   |
| end   | 以 `YYYYMMDD`格式的結束日期（包括尾日）, *例如: 20161231。* | 是   |

[3. 歷史存檔文件下載API](https://data.gov.hk/tc/help/api-spec#collapse-2)


## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

數據篩選應用程式介面

**例子:
數據集: 放債人牌照**

**數據資源: 現有放債人牌照持牌人名單**
URL: [http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv](http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv)

**API端點**

https://api.data.gov.hk/v2/filter

注意：本應用程式介面最新版本為2，我們仍然支援版本1。

本應用程式介面接受查詢字串輸入。

**輸入**

**查詢字串輸入參數**

| 名稱 | 值說明                                                            | 必要 |
| ---- | ----------------------------------------------------------------- | ---- |
| q    | 網址編碼(URL-Encoded) JSON 物件字串(有關詳細信息，請參閱以下描述) | 是   |

**給查詢字串參數 "q" 的 JSON 物件字串規格**

| 成員/名字 | JSON 數據類型 | 值說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 必要 |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| resource  | string        | URL資源. URL可以在本頁的頂部找到                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 是   |
| section   | number        | 章節編號（僅在"數據部分"可用時才需要）* 由1開始的正整數 (預設: 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 否   |
| filter    | array         | 篩選條件的數據陣列：[ [F1], [F2], ..., [Fn] ]F 為篩選條件。篩選條件數據陣列中每一個篩選條件皆為數據陣列，當中包含三個JSON元素，如下：Fn = [ Cn, "OP", [ "O1", "O2", ..., "On" ] ]Cn 為欄位編號(number)``OP 為篩選條件運算符(string)，以下列表為目前所支持的篩選條件運算符：**eq** - 等於``**ne** - 不等於``**in** - 在...之內 (只限文字)``**ni** - 不在...之內 (只限文字)``**lt** - 小於 (只限數字)``**le** - 小於或等於 (只限數字)``**gt** - 大於 (只限數字)``**ge** - 大於或等於 (只限數字)``**bt** - 在...之間 (只限數字)``**ct** - 包含 (只限文字)``**nct** - 不包含 (只限文字)``**bw** - 以...開始 (只限文字)``**nbw** - 不以...開始 (只限文字)``**ew** - 以...結束 (只限文字)``**new** - 不以...結束 (只限文字)在 [ "O1", "O2", ..., "On" ] 數據陣列中，O (string) 為篩選條件操作數。當篩選條件運算符 OP 為 bw （在...之間）時，必需提供兩個篩選條件操作數。當篩選條件運算符 OP 為 in （在...之內） 或 ni（不在...之內）時，必需提供兩個或更多的篩選條件操作數。其餘的篩選條件運算符只需提供一個篩選條件操作數。 | 否   |
| sorts     | array         | 排序條件的數據陣列：``[ [S1], [S2], ..., [Sn] ]S 為排序條件。排序條件數據陣列中每一個排序條件皆為數據陣列，當中包含兩個JSON元素，如下：Sn = [ Cn, "ORDER" ]Cn 為欄位編號(number)``ORDER 為排序條件(string), 以下為可選的排序條件值：asc - 升序``desc - 降序                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 否   |
| format    | string        | 輸出格式:CSV (預設)``json``xml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 否   |

**例子**

輸入

resource = https://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv

section = 1,

篩選條件及排序條件為：

欄位編號 1 中，其值等於 “3983” 和，

欄位編號 2 中，其值不包含 “2021”和，

欄位編號 4 ，排序為升序 和，

欄位編號 7 ，排序為降序

format（輸出格式）= JSON,

JSON 物件

```
{
	"resource":"http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv",
	"section":1,
	"format":"json",
	"sorts":[
		[4,"asc"],[7,"desc"]
	],
	"filters":[
		[1,"eq",["3983"]],[2,"nct",["2021"]]
	]
}
                  
```

**輸出 [JSON 物件]**

根據"format"參數的CSV、JSON或XML檔案 以上為 JSON 物件字串

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-file

**HTTP請求方法： GET**

取回基於 `time`的檔案（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 參數                                                            | 必要 |
| ---- | --------------------------------------------------------------- | ---- |
| url  | 檔案網址，網址可從歷史檔案文件列表應用程式介面結果中找到。      | 是   |
| time | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是   |

補充資訊:

* 所有時間均以GMT + 8時區為準。
* 最新的歷史數據來自昨天。

[4. 歷史存檔模式下載API](https://data.gov.hk/tc/help/api-spec#collapse-3)

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-schema

取回基於 `date`的模式（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 描述                                              | 必要 |
| ---- | ------------------------------------------------- | ---- |
| url  | 數據集的網址                                      | 是   |
| date | 以 `YYYYMMDD`格式的日期,  *例如: 20160101* 。 | 是   |

[5. 歷史存檔數據字典API](https://data.gov.hk/tc/help/api-spec#collapse-4)

**API端點**

https://app.data.gov.hk/v1/historical-archive/get-data-dictionary

取回基於 `date`的數據字典（`url`中提供）歷史版本。

如果是一個成功的呼叫，狀態碼 `302` 將會返回, 請求者需要跟隨重定向然後接收狀態碼 `200` 和檔案。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。
如果請求的歷史版本檔案不存在，JSON格式的錯誤清單將會隨著狀態碼 `404` 返回。

| 參數 | 描述                                              | 必要 |
| ---- | ------------------------------------------------- | ---- |
| url  | 數據集的網址                                      | 是   |
| date | 以 `YYYYMMDD`格式的日期,  *例如: 20160101* 。 | 是   |

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。



## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

* ### 下載歷史數據應用程式介面
* ### 數據篩選應用程式介面
* ### 尋找附近設施應用程式介面

**例子:
數據集: 放債人牌照**

**數據資源: 現有放債人牌照持牌人名單**
URL: [http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv](http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv)

**API端點**

https://api.data.gov.hk/v2/filter

注意：本應用程式介面最新版本為2，我們仍然支援版本1。

本應用程式介面接受查詢字串輸入。

**輸入**

**查詢字串輸入參數**

| 名稱 | 值說明                                                            | 必要 |
| ---- | ----------------------------------------------------------------- | ---- |
| q    | 網址編碼(URL-Encoded) JSON 物件字串(有關詳細信息，請參閱以下描述) | 是   |

**給查詢字串參數 "q" 的 JSON 物件字串規格**

| 成員/名字 | JSON 數據類型 | 值說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 必要 |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| resource  | string        | URL資源. URL可以在本頁的頂部找到                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 是   |
| section   | number        | 章節編號（僅在"數據部分"可用時才需要）* 由1開始的正整數 (預設: 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 否   |
| filter    | array         | 篩選條件的數據陣列：[ [F1], [F2], ..., [Fn] ]F 為篩選條件。篩選條件數據陣列中每一個篩選條件皆為數據陣列，當中包含三個JSON元素，如下：Fn = [ Cn, "OP", [ "O1", "O2", ..., "On" ] ]Cn 為欄位編號(number)``OP 為篩選條件運算符(string)，以下列表為目前所支持的篩選條件運算符：**eq** - 等於``**ne** - 不等於``**in** - 在...之內 (只限文字)``**ni** - 不在...之內 (只限文字)``**lt** - 小於 (只限數字)``**le** - 小於或等於 (只限數字)``**gt** - 大於 (只限數字)``**ge** - 大於或等於 (只限數字)``**bt** - 在...之間 (只限數字)``**ct** - 包含 (只限文字)``**nct** - 不包含 (只限文字)``**bw** - 以...開始 (只限文字)``**nbw** - 不以...開始 (只限文字)``**ew** - 以...結束 (只限文字)``**new** - 不以...結束 (只限文字)在 [ "O1", "O2", ..., "On" ] 數據陣列中，O (string) 為篩選條件操作數。當篩選條件運算符 OP 為 bw （在...之間）時，必需提供兩個篩選條件操作數。當篩選條件運算符 OP 為 in （在...之內） 或 ni（不在...之內）時，必需提供兩個或更多的篩選條件操作數。其餘的篩選條件運算符只需提供一個篩選條件操作數。 | 否   |
| sorts     | array         | 排序條件的數據陣列：``[ [S1], [S2], ..., [Sn] ]S 為排序條件。排序條件數據陣列中每一個排序條件皆為數據陣列，當中包含兩個JSON元素，如下：Sn = [ Cn, "ORDER" ]Cn 為欄位編號(number)``ORDER 為排序條件(string), 以下為可選的排序條件值：asc - 升序``desc - 降序                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 否   |
| format    | string        | 輸出格式:CSV (預設)``json``xml                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 否   |

**例子**

輸入

resource = https://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv

section = 1,

篩選條件及排序條件為：

欄位編號 1 中，其值等於 “3983” 和，

欄位編號 2 中，其值不包含 “2021”和，

欄位編號 4 ，排序為升序 和，

欄位編號 7 ，排序為降序

format（輸出格式）= JSON,

JSON 物件

```
{
	"resource":"http://www.cr.gov.hk/datagovhk/psi/ml_licensees.csv",
	"section":1,
	"format":"json",
	"sorts":[
		[4,"asc"],[7,"desc"]
	],
	"filters":[
		[1,"eq",["3983"]],[2,"nct",["2021"]]
	]
}
                  
```

**輸出 [JSON 物件]**

根據"format"參數的CSV、JSON或XML檔案 以上為 JSON 物件字串

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。

### **2. RSS新闻源**

- **中文RSS**: `https://www.info.gov.hk/gia/rss/general_zh.xml`
- **英文RSS**: `https://www.info.gov.hk/gia/rss/general_en.xml`

### **3. 备用新闻源**

- **香港电台新闻**: `https://rthk.hk/rthk/news/rss/e_expressnews_elocal.xml`
- **香港政府开放数据**: `https://data.gov.hk/tc/help/api-spec`

## 🔍 当前搜索关键词

### **中文关键词**

```
地盤, 工業意外, 墮下, 夾傷, 不幸離世, 高度關注,
安全, 建築, 工程, 意外, 受傷, 死亡, 工地, 施工,
建築業, 工業安全, 職安健, 職業安全, 施工安全, 地盤安全,
勞工處, 發展局, 政府新聞處, 巡查, 監管, 措施, 指引
```

### **英文关键词**

```
construction, accident, fall, injured, safety, workplace,
industrial, site, work, fatality, injury, death,
building, industry, occupational, health, safety,
labor, development, government, inspection, regulation
```

## 📊 系统配置

### **搜索范围**

- **日期范围**: 3个月内数据
- **部门搜索**: 政府新闻处、劳工处、发展局
- **数据源**: RSS实时新闻 + 历史档案数据

### **数据获取策略**

1. **优先RSS新闻** - 获取实时地盘意外资讯
2. **补充历史数据** - 当RSS数据不足时补充
3. **禁用备用消息** - 只显示真实获取的数据

## 🚀 使用方法

在WhatsApp群组中使用以下命令：

```
!monitor    - 香港政府地盤意外監控
!監控       - 中文命令
```

## 📈 监控状态

系统将显示：

- 真实获取的新闻数量
- 数据来源部门
- 搜索关键词匹配情况
- 是否有相关资讯获取到


## 應用程式 介面規格

一個可以幫助您檢查有關「開放數據平台」的學習教程和資料的地方

下載歷史數據應用程式介面

[1. 歷史資料庫文件列表API](https://data.gov.hk/tc/help/api-spec#collapse-0)

[2. 歷史存檔文件版本API](https://data.gov.hk/tc/help/api-spec#collapse-1)

**API端點**

https://app.data.gov.hk/v1/historical-archive/list-file-versions

**HTTP請求方法： GET**

取回在日期（`start` 和 `end`中提供）以內的檔案（`url`中提供）的歷史版本清單。
只有首*10,000*個結果將會返回。

如果是一個成功的呼叫，JSON格式的歷史版本時間戳清單，結果總計和字節總大小將會隨著狀態碼 `200` 返回。
如果請求含有語法錯誤例如缺少必要的參數，JSON格式的錯誤清單將會隨著狀態碼 `400` 返回。

| 參數  | 描述                                                            | 必要 |
| ----- | --------------------------------------------------------------- | ---- |
| url   | 檔案網址，網址可從歷史檔案文件列表應用程式介面結果中找到。      | 是   |
| start | 以 `YYYYMMDD`格式的開始日期（包括首日）, *例如: 20160101。* | 是   |
| end   | 以 `YYYYMMDD`格式的結束日期（包括尾日）, *例如: 20161231。* | 是   |

[3. 歷史存檔文件下載API](https://data.gov.hk/tc/help/api-spec#collapse-2)

[4. 歷史存檔模式下載API](https://data.gov.hk/tc/help/api-spec#collapse-3)

[5. 歷史存檔數據字典API](https://data.gov.hk/tc/help/api-spec#collapse-4)

注意:
本應用程式介面(介面)由「開放數據平台」團隊開發，旨在為軟件及應用程式開發商提供使用原始數據集的不同角度和方法。經由本介面產生的數據子集，或未載有原始數據集內由數據提供者提供的全部資料。使用本介面時，務須參考原始數據集，以掌握全面資料。




---

*最后更新: 2026年4月17日*
