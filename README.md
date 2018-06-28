# questland api

### ports:

    api: 42080

### marsgpl:

    cd ~/projects/questland/api

    yarn

    cd ~/projects/questland/api/docker

    docker-compose up -d mongo

    docker-compose stop api && docker-compose up -d api && docker-compose logs -f --tail=32 api

    docker-compose rm --stop --force api

### marsgpl mongo:

    docker exec -it questland_mongo_1 mongo admin
        db.createUser({ user:"root", pwd:"ofvi8h8gASvihnf9g8h", roles:[{role:"userAdminAnyDatabase",db:"admin"},{role:"clusterAdmin",db:"admin"},{role:"readAnyDatabase",db:"admin"}] })
        exit

    docker exec -it questland_mongo_1 mongo -u root -p ofvi8h8gASvihnf9g8h admin
        use reforge
        db.createUser({ user:"reforge", pwd:"d0s9hf5SDJgDH83585", roles:["readWrite"] })
        exit

    docker exec -it questland_mongo_1 mongo -u reforge -p d0s9hf5SDJgDH83585 reforge
        show collections
