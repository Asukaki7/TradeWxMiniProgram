Page({

  /**
   * 页面的初始数据
   */
  data: {
    menuList:[],
    productList: [],
    cartList: [],
    currentIndex: 0,
    currentGroupId: "",
    baseUrl: "",
    scrollTop: 0,
    hideModal: true,
    ani: '',
    totalNum: 0, // 已选商品数量
    totalPrice: 0, // 已选商品总金额
    allChecked: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getGoodsGroup()
  },

  // 获取商品分组
  getGoodsGroup() {
    goodsGroupFindAll(data).then(res => {
      if(res.data.code === 1) {
        this.setData({
          menuList: res.data.data.content
        })
        if(this.data.currentGroupId) {
          this.getProductList(this.data.currentGroupId)
        } else {
          this.getProductList(res.data.data.content[0].id)
        }
      } else {
        wx.showToast({
          title: res.data.msg,
          icon: 'none'
        })
      }
    })
  },

  // 获取商品列表
  getProductList(groupId) {
    let data = {}
    data.groupId = groupId
    goodsMallFindAll(data).then(res => {
      if(res.data.code === 1) {
         
        this.setData({productList: res.data.data})
      } else {
        wx.showToast({
          title: res.data.msg,
          icon: 'none'
        })
      }
    })
  },

  // 获取所有商品更新缓存购物车数据
  getAllProduct() {
    let data = {}
    data.shopId = wx.getStorageSync('shop').id
    goodsMallFindAll(data).then(res => {
      if(res.data.code === 1) {
        let allProduct = res.data.data
        let cart = wx.getStorageSync('cart') || []
        let allProductId = allProduct.map(e => e.id)
        cart = cart.filter(e => allProductId.includes(e.id))
        cart = cart.map(ele => {
          allProduct.map(ele2 => {
            if(ele.id == ele2.id) {
              ele = Object.assign(ele, ele2);
            }
          })
          return ele
        })
        wx.setStorageSync('cart', cart)
        this.setCart()
      } else {
        wx.showToast({
          title: res.data.msg,
          icon: 'none'
        })
      }
    })
  },

  // 购物车回填商品列表数据
  handleList() {
    let cart = wx.getStorageSync('cart') || []
    let productList = this.data.productList.map(item => {
      delete item.num
      return item
    })
    productList.map(item => {
      cart.map(v => {
        if(item.id === v.id) {
          item.num = v.num
        } 
      })
    })
    this.setData({productList})
  },

  // 点击侧边栏
  handleMenuItemChange(e) {
    let {index,id} = e.currentTarget.dataset
    this.setData({
      currentIndex: index,
      currentGroupId: id,
      scrollTop: 0
    })
    this.getProductList(id)
  },

  // 点击购物车
  handleCart() {
    this.setData({
      cartList: wx.getStorageSync('cart'),
    })
    if(wx.getStorageSync('cart') && wx.getStorageSync('cart').length != 0) {
      this.setData({hideModal: false})
    } else {
      wx.showToast({
        title: '请添加商品',
        icon: 'none'
      })
    }
  },

  // 阻止事件冒泡
  preventBubbling() {},

  // 加入购物车
  doPlusNum(e) {
    console.log(e);
    let productInfo = e.currentTarget.dataset.item
    let cart = wx.getStorageSync('cart') || []
    let index = cart.findIndex(v => v.id === productInfo.id)
    if(index === -1) { 
      cart.push({ productInfo,num: 1,checked: true})
    } else {
      cart[index].num = cart[index].num + 1
    }
    wx.setStorageSync('cart', cart)
    this.setData({cartList: cart})
    wx.showToast({
      title: '商品已放入购物车',
      icon: 'none'
    })
    this.cartWwing()
    this.setCart()
  },

  // 移除出购物车
  doMinusNum(e) {
    let that = this
    console.log(e);
    let productInfo = e.currentTarget.dataset.item
    let cart = wx.getStorageSync('cart') || []
    let index = cart.findIndex(v => v.id === productInfo.id)
    if(cart[index].num > 1) {
      cart[index].num--;
      this.setCart(cart)
    } else if(cart[index].num == 1) {
      cart[index].num = 0
      wx.showModal({
        content: '确定不要了吗？',
        success(res) {
          if(res.confirm) {
            cart.splice(index,1)
          } else if(res.cancel) {
            cart[index].num = 1
          }
          that.setCart(cart)
        }
      })
    } 
  },

  // 设置购物车状态
  setCart(cart) {
    cart = cart ? cart : wx.getStorageSync('cart') || []
    if(cart.length === 0) {
      this.setData({hideModal: true})
    }
    let allChecked = true,totalNum = 0,totalPrice = 0
    cart.forEach(v => {
      if(v.checked) {
        totalPrice += getRoundeNumber(v.price * v.num) * 1
        totalNum += v.num
      } else {
        allChecked = false
      }
    })
    allChecked = cart.length != 0 ? allChecked : false
    wx.setStorageSync('cart', cart)
    this.setData({
      allChecked,
      totalNum,
      totalPrice,
      cartList: cart
    })
    this.handleList()
  },

  // 加入购物车动画
  cartWwing: function(){
    var animation = wx.createAnimation({
      duration: 100,
      timingFunction: 'ease-in'
    })
    animation.translateX(6).rotate(21).step()
    animation.translateX(-6).rotate(-21).step()
    animation.translateX(0).rotate(0).step()
    // 导出动画
    this.setData({
      ani: animation.export()
    })
  },

  // 购物车勾选
  checkboxChange(e) {
    console.log(e);
    let { id } = e.currentTarget.dataset
    let cartList = JSON.parse(JSON.stringify(this.data.cartList))
    let index = cartList.findIndex(v => v.id === id)
    cartList[index].checked = !cartList[index].checked
    this.setCart(cartList)
  },

  // 全选
  handleAllCheck() {
    let { cartList,allChecked } = this.data
    allChecked = !allChecked
    cartList.forEach(v => v.checked = allChecked)
    this.setCart(cartList)
  },

  // 清空购物车
  handleClearCart() {
    let that = this
    wx.showModal({
      content:'确定不要了吗？',
      success(res) {
        if(res.confirm) {
          that.setCart([])
        } else if(res.cancel) {
          console.log('用户点击取消');
        }
      }
    })
  },

  // 支付跳转
  placeTheOrder() {
    let data = {}
     
    orderGoodsInsert(data).then(res => {
      if(res.data.code === 1) {
   		 
        // 删除缓存中已经下单的商品
        let newCart = wx.getStorageSync('cart').filter(v => !v.checked)
        this.setCart(newCart)
      } else {
        wx.showToast({
          title: res.data.msg,
          icon: 'none'
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setCart()
  }
})
