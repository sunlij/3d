import idcBarn from './idcBarn.json'
import idcCabinet from './idcCabinet.json'
import idcDevice from './idcDevice.json'

const data = {
  idcBarn,
  idcCabinet,
  idcDevice
}

function getDate(name, time = 100) {
  let promise = new Promise(function (resolve, reject) {
    setTimeout(function(){
      if(data[name]){
        resolve(data[name])
      } else {
        reject({
          msg: 'error'
        })
      }
      
    }, time)
  })
  return promise
}

export default getDate