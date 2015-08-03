app.config(function($stateProvider) {
  $stateProvider.state('albumDetail', {
    url: '/albums/:albumId',
    controller: 'AlbumController',
    templateUrl: 'js/album/album.html',
    resolve: {
      user: function(AuthService) {
        return AuthService.getLoggedInUser();
      },
      album: function(AlbumFactory, $stateParams) {
        //make call to get album info for specific album from server
        return AlbumFactory.getAlbum($stateParams.albumId);
      }
    }
  })
})

app.controller('AlbumController', function($scope, $rootScope, user, album, $state, UserFactory, AuthService, CartFactory, localStorageService, TrackFactory, $sce){

  $scope.user = user;
  $scope.album = album;
  $scope.tracks = [];

  //TODO: if album does not have spotifyId, search for album with spotify get request, and save to database
  $scope.checkSpotifyId = function(title){
    var queryAlbum = title.split(' ').join('+');
    var query = `?q=${queryAlbum}&type=album&market=US`;
    //if(!$scope.album.spotifyId){
      TrackFactory.searchAlbums(query)
      .then(function(res){
        console.log("checkSpotifyId result", res);
      })
    //}
  }

  $scope.checkSpotifyId('The Best Of Shaggy');

  //Get tracks from spotify for current album
  TrackFactory.fetchTracks($scope.album.spotifyId)
  .then(function(res){
    res.items.forEach(function(track){
      $scope.tracks.push({name: track.name, URL: $sce.trustAsResourceUrl(track.preview_url)});
    })
  })

  $scope.addToCart = function(currentAlbum){
    if($scope.user){
      var userCart = localStorageService.get('userCart');
      if (!userCart) {
        userCart = [{
          album: currentAlbum,
          quantity: 1
        }];
        localStorageService.set('userCart', userCart);
      } else {
        CartFactory.addAlbum(currentAlbum, userCart);
        localStorageService.set('userCart', userCart);
      }
      $scope.user.cart = userCart;
      UserFactory.updateUser($scope.user._id, $scope.user)
        .then(function(updatedUser) {
          $state.go('cart');
        })
    } else {
      var guestCart = localStorageService.get('cart');
      if (!guestCart) {
        guestCart = [{
          album: currentAlbum,
          quantity: 1
        }];
        localStorageService.set('cart', guestCart);
      } else {
        CartFactory.addAlbum(currentAlbum, guestCart);
        localStorageService.set('cart', guestCart);
      }
      $state.go('guestCart');
    }
  };
})