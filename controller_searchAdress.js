/**
 * Created by dexter on 16/2/22.
 */
angular.module('icarbonx').controller('searchAddressController', ['$window', '$document','$rootScope', '$stateParams', '$scope','$timeout', 'footMenuCreator', 'addressCreator', 'userService', function ($window, $document,$rootScope,$stateParams, $scope, $timeout, footMenuCreator, addressCreator, userService) {
  var m
  $scope.uiState={
    view:'map',
    letterList:['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','W','X','Y','Z'],
    addressList:[],
    cityList:baiduMapData,
    currentcity:'深圳市',
    loading:true,
    loadingParam : {
      state: CONST.LOADING,
      reLoading: function () {
        $timeout(function () {
          $scope.uiState.loadingParam.state = CONST.LOADING;
          startInit();
        })
      }
    }
  }


  function loadingFinish(state) {
    $timeout(function () {
      $scope.uiState.loadingParam.state = state
    }, 350)
  }

  $scope.chooseCity=function(cityname){
    m.getIpByCity(cityname,function(ip){
      m.updateIpAndMarket(ip)
    })
  }

  $scope.loadNextPage=(function(){
    var timer
    return function(){
      $scope.uiState.loading=true
      console.log($scope.uiState.loading)
      clearTimeout(timer)
      timer=setTimeout(function(){
        console.log(m.inner.nextpage+'页码')
        m.inner.localSearch.gotoPage(m.inner.nextpage)
      },100)
      console.log($scope.uiState.loading)
    }
  })()

  $scope.chooseAdress=(function (){
    function saveLocal(obj) {
      obj.fullAddress=obj.province+' '+ obj.city+ ' '+ obj.district
      removeLocalStorage('chooseadress')
      setLocalStorage('chooseadress',{
        province:obj.province,
        city:obj.city,
        district:obj.district,
        title:obj.title,
        address:obj.address,
        fullAddress:obj.fullAddress
      })
      console.log('localStorage存储以下对象')
      console.log(getLocalStorage('chooseadress'))
      //return;
      $scope.$emit('goTo', -1)
    }
    return  function(item){
      var pattern=/((.*)省)?((.*)市)?((.*)区)?((.*)县)?(.*)/gi
      var address=item.address
      var obj={}
      var p=pattern.exec(address)
      obj.province=item.province
      obj.city=item.city
      obj.district=p[5]||p[7]||''
      obj.title=item.title||''
      obj.address=p[9]||''
      if(!obj.district){
        console.log('单独查找district')
        m.getAddressByIP(item.point,function(result){
          if(result&&result.addressComponents){
            obj.district=result.addressComponents.district
            return saveLocal(obj)
          }
        })
      }else{
        saveLocal(obj)
      }
    }})()



  var addressPanel=document.getElementById('addressPanel')
  $scope.letterSearch=(function(){
    var letters=[],quality=[]
    $scope.uiState.cityList.map(function(value){
      letters.push(value.letter)
      quality.push(value.list.length)
    })

    return  function(letter){
      var titlemeheight=document.querySelector('.titleme').offsetHeight
      var addressliheight=document.querySelector('.addressli').offsetHeight
      var index=letters.indexOf(letter)
      var sum=0
      if(index>0){
        sum=quality.slice(0,index).reduce(function(previous, current){
          return previous + current;
        })
      }
      var scolltop=index*titlemeheight+sum*addressliheight
      addressPanel.scrollTop=scolltop
    }
  })()


  var searchResultPanel=document.getElementById('searchResultPanel')
  var searchResultPane2=document.getElementById('searchResultPane2')

  var compareHeight=function(ele){
    var scrollh=ele.scrollHeight
    var offseth=ele.offsetHeight
    var scrolltoph=ele.scrollTop
    return parseInt(scrollh)-(parseInt(offseth)+parseInt(scrolltoph))

    console.log('scrollh'+scrollh)
    console.log('offseth'+offseth)
    console.log('scrolltoph'+scrolltoph)
    console.log(offseth+scrolltoph)
    console.log('-----------------------------------')
  }

  document.getElementById('suggestId').addEventListener('input',function(e){
    console.log('输入中.....'+e.target.value)
    var keyword=e.target.value
    m.search({keyword:keyword})
  })

  searchResultPanel.addEventListener('scroll',function(e){
    if(Math.abs(compareHeight(searchResultPanel))<=10){
      $scope.loadNextPage()
    }
  })
  searchResultPanel2.addEventListener('scroll',function(e){
    if(Math.abs(compareHeight(searchResultPanel2))<=10){
      $scope.loadNextPage()
    }
  })

  function mapInit(){
    m=baiduMap
    m.setArgs({
      mapid:'map',
      auto_omplete_id:'suggestId'
    })
    m.initMap(function(){
      var timer
      m.addAutoComplete(function(refresh){
        $scope.uiState.currentcity=m.inner.city
        $scope.uiState.addressList=m.getInner('addressList')
        clearTimeout(timer)
        timer=setTimeout(function(){
          $scope.uiState.loading=m.inner.loading
        },0)

        if(refresh) document.getElementById('searchResultPanel').scrollTop=0
        $scope.$apply()
      })
      m.getUserIp(function(){

      })
    })
  }


  userService.getPersonInfo(function (response) {
    if (response && response.data) {
      $scope.personId = response.data.personId;
      loadingFinish(CONST.LOADING_SUCCESS);
      mapInit()
    }
  },function(){
    loadingFinish(CONST.LOADING_FAIL);
  });
}]);

