
import type { Ref } from 'vue';
import { useRoute } from 'vue-router'
import { backendBaseUri, toString } from "./api";

import {
  NButton,
  NTime,
} from 'naive-ui'

import { h } from "vue";
import type { InternalRowData } from 'naive-ui/lib/data-table/src/interface';


let apiCode = () => localStorage.getItem("x-api-subuser-code") || ""



const uri = {
  login(sheet_id: string) {
    return `/api/user/${sheet_id}/subuser/login`
  },
  getSheetColumns(sheet_id: string) {
    return `/api/sheet/${sheet_id}/columns`
  },
  getRowsFromDb(sheet_id: string) {
    return `/api/sheet/${sheet_id}/rows`
  },
  insertRowToDb(sheet_id: string) {
    return `/api/sheet/${sheet_id}/row/insert`
  },

  updateRowToDb(sheet_id: string, row_id: string | unknown) {
    return `/api/sheet/${sheet_id}/row/${row_id}/update`
  },
  deleteRowFromDb(sheet_id: string, row_id: string | unknown) {
    return `/api/sheet/${sheet_id}/row/${row_id}/delete`
  },
  deleteRowsFromDb(sheet_id: string) {
    return `/api/sheet/${sheet_id}/rows/delete`
  },
  outputToXlsxFile(sheet_id: string, row_id: string | unknown) {
    return `/api/sheet/${sheet_id}/rows/${row_id}/xlsx`
  },
  outputRowsToXlsx(sheet_id: string) {
    return `/api/sheet/${sheet_id}/rows/xlsx`
  }

}

let sheetApiMethods = {

  request(method: string = "GET", url: string = "http://", body: any = undefined, content_type: string = "application/json") {
    let headers: Record<string, string> = {
      "x-api-subuser-code": apiCode(),
      "content-type": content_type
    }

    return fetch(url, {
      method: method,
      headers: headers,
      body: body,
      mode: "cors",
    })
  },
  resetLoginStatus(visible: Ref) {
    delete localStorage["x-api-subuser-code"]
    delete localStorage["name"]
    visible.value.subUserLoginVisible = true
  },

  checkSheetIdAndApiCode(sheetId: Ref, rawColumns: Ref, drawerColumns: Ref, tableColumns: Ref, currentRow: Ref, drawerTitle: Ref, visible: Ref, TableloadingStatus: Ref, rawRows: Ref) {
    const route = useRoute()
    if (route.query.sheet_id && route.query.sheet_id.length == 32) {
      sheetId.value = toString(route.query.sheet_id)
      console.log("checkSheetIdAndApiCode", sheetId)
    } else {
      location.assign("/")
    }
    if (!apiCode) {
      visible.value.subUserLoginVisible = true
    } else {
      sheetApiMethods.getSubUserColumns(sheetId, rawColumns, drawerColumns, tableColumns, currentRow, drawerTitle, visible, TableloadingStatus, rawRows)
      sheetApiMethods.getSubUserRows(TableloadingStatus, sheetId, rawRows, visible)
    }
  },

  sheetSubuserLogin(sheetId: Ref, subUser: Ref, callback: Function) {
    sheetApiMethods.request("POST", backendBaseUri + uri.login(sheetId.value), JSON.stringify({ "account": subUser.value.account, "password": subUser.value.password }), "application/json").then((resp) => {
      if (resp.status == 200) {
        return resp.json().then((data) => {
          console.log("sheetSubuserLogin", data)
          localStorage.setItem("x-api-subuser-code", data["x-api-subuser-code"])
          localStorage.setItem("name", data["name"])
          callback(true)
        })
      } else {
        callback(false)
      }
    })
  },


  getSubUserRows(TableloadingStatus: Ref, sheetId: Ref, rawRows: Ref, visible: Ref) {
    TableloadingStatus.value = true
    sheetApiMethods.request("GET", backendBaseUri + uri.getRowsFromDb(sheetId.value), undefined).then((resp) => {
      if (resp.status != 200) {
        TableloadingStatus.value = false
        sheetApiMethods.resetLoginStatus(visible)
        return
      } else {
        resp.json().then((data) => {
          console.log("getSubUserRows", data)
          rawRows.value = data
          TableloadingStatus.value = false
        })
      }
    })
  },


  resetCurrentRow(currentRow: Ref, rawColumns: Ref) {
    // ????????????????????????
    Object.keys(rawColumns.value).forEach((key) => {
      // ??????????????????
      currentRow.value[key] = ""
    })
    console.log("resetCurrentRow", currentRow)
  },

  // ??????????????????????????????????????????????????????  currentRow
  fillCurrentRow(currentRow: Ref, rawColumns: Ref, rowData: InternalRowData) {
    // ????????????????????????
    Object.keys(rowData).forEach((key) => {
      // ??????????????????
      currentRow.value[key] = rowData[key]
    })
    console.log("resetCurrentRow", currentRow)
  },

  getSubUserColumns(sheetId: Ref, rawColumns: Ref, drawerColumns: Ref, tableColumns: Ref, currentRow: Ref, drawerTitle: Ref, visible: Ref, TableloadingStatus: Ref, rawRows: Ref) {
    sheetApiMethods.request("GET", backendBaseUri + uri.getSheetColumns(sheetId.value), undefined).then((resp) => {
      if (resp.status != 200) {
        sheetApiMethods.resetLoginStatus(visible)
        return
      } else {
        resp.json().then((data) => {
          // console.log(data)
          // ??????????????????
          rawColumns.value = data

          // ????????????????????? naive-ui Table ???????????????
          // temp ?????? key ??? title ??????????????? naiveui ????????????
          let temp: any[] = []
          temp.push({
            "type": "selection",
          })
          // temp2 ????????? type ??????????????????????????????????????????
          let temp2: any[] = []
          Object.keys(data).forEach((key) => {
            temp.push({
              "key": key,
              "title": data[key]["name"],

            })
            temp2.push({
              "key": key,
              "title": data[key]["name"],
              "type": data[key]["type"],
            })

          })
          // ????????????????????????,???????????????????????????
          drawerColumns.value = temp2
          // ??????????????????
          const vnode = {
            title: '??????',
            render(rowData: InternalRowData) {

              let btns: any[] = []
              const editButton = h(
                NButton,
                {
                  strong: true,
                  secondary: true,
                  type: "info",
                  onClick: () => {
                    console.log("?????? rowData", rowData, "-> currentRow", currentRow)
                    // currentRow.value = rowData
                    sheetApiMethods.fillCurrentRow(currentRow, rawColumns, rowData)
                    drawerTitle.value = "??????"
                    visible.value.createNewRowDrawerVisible = true
                    // console.log("????????? currentRow",currentRow)
                  }
                },
                { default: () => "??????" }
              )
              const deleteButton = h(
                NButton,
                {
                  strong: true,
                  secondary: true,
                  type: "info",
                  style: "margin-left:5px;",
                  onClick: () => {
                    console.log("??????", rowData)
                    currentRow.value = rowData

                    const ok = confirm("????????????????")
                    if (ok) {
                      sheetApiMethods.deleteRow(sheetId, currentRow, (ok: boolean) => {
                        if (!ok) {
                          alert("???????????? ??????????????????")
                        } else {
                          sheetApiMethods.getSubUserRows(TableloadingStatus, sheetId, rawRows, visible)
                        }
                      })
                    }
                  }
                },

                { default: () => "??????" }
              )

              const outputXlsxButton = h(
                NButton,
                {
                  strong: true,
                  secondary: true,
                  type: "info",
                  style: "margin-left:5px;",
                  onClick: () => {
                    console.log("??????", rowData)
                    currentRow.value = rowData
                    sheetApiMethods.outputToXlsxFile(sheetId, currentRow)
                  }
                },

                { default: () => "??????" }
              )

              btns.push([editButton, deleteButton, outputXlsxButton])
              return btns
            }
          }

          temp.push(vnode)
          tableColumns.value = temp
          console.log("tableColumns", tableColumns)
        })
      }
    })
  },



  insertRow(sheetId: Ref, currentRow: Ref, callback: Function) {

    sheetApiMethods.request("POST", backendBaseUri + uri.insertRowToDb(sheetId.value), JSON.stringify(currentRow.value), "application/json").then((resp) => {
      if (resp.status == 200) {
        callback(true)
      } else {
        callback(false)
      }
    })
  },

  updateRow(sheetId: Ref, currentRow: Ref, callback: Function) {

    sheetApiMethods.request("POST", backendBaseUri + uri.updateRowToDb(sheetId.value, currentRow.value.rowid), JSON.stringify(currentRow.value), "application/json").then((resp) => {
      if (resp.status == 200) {
        callback(true)
      } else {
        callback(false)
      }
    })
  },



  deleteRow(sheetId: Ref, currentRow: Ref, callback: Function) {
    sheetApiMethods.request("POST", backendBaseUri + uri.deleteRowFromDb(sheetId.value, currentRow.value.rowid), undefined, "application/json").then((resp) => {
      if (resp.status == 200) {
        callback(true)
      } else {
        callback(false)
      }
    })
  },

  deleteRows(sheetId: Ref,tableSelectedRowKeys:Ref , callback: Function) {
    sheetApiMethods.request("POST", backendBaseUri + uri.deleteRowsFromDb(sheetId.value), JSON.stringify(tableSelectedRowKeys.value), "application/json").then((resp) => {
      if (resp.status == 200) {
        callback(true)
      } else {
        callback(false)
      }
    })
  },



  outputToXlsxFile(sheetId: Ref, currentRow: Ref) {
    sheetApiMethods.request("GET", backendBaseUri + uri.outputToXlsxFile(sheetId.value,currentRow.value.rowid),undefined, "application/json").then((resp) => {
      if (resp.status == 200) {
        resp.blob().then((blob) => {
          let objectUrl = URL.createObjectURL(blob);
          let link = document.createElement('a');
          link.style.display = "none";
          link.href = objectUrl;
          link.download = '????????????-' + currentRow.value[Object.keys(currentRow.value)[1]] + '.xlsx';
          link.click();
          URL.revokeObjectURL(objectUrl);
          document.body.removeChild(link);
        })

      }
    })
  },

  
  outputRows(sheetId: Ref,tableSelectedRowKeys:Ref,callback:Function) {
    sheetApiMethods.request("POST", backendBaseUri + uri.outputRowsToXlsx(sheetId.value), JSON.stringify(tableSelectedRowKeys.value), "application/json").then((resp) => {
      if (resp.status == 200) {
        callback(true)
        resp.blob().then((blob) => {
          let objectUrl = URL.createObjectURL(blob);
          let link = document.createElement('a');
          link.style.display = "none";
          link.href = objectUrl;
          
          link.download = '??????????????????-' + new Date().getTime() + '.zip';
          link.click();
          URL.revokeObjectURL(objectUrl);
          document.body.removeChild(link);
          
        })}
        else{
          callback(false)
        }

    })
  },


}




export {
  sheetApiMethods,
  apiCode
}