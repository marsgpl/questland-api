# questland api

### ports:

    api: 42080

### start:

    cd ~/projects/questland/api

    yarn

    cd ~/projects/questland/api/docker

    docker-compose up -d mongo

    docker-compose stop api && docker-compose up -d api && docker-compose logs -f --tail=32 api

    docker-compose stop api && docker-compose up -d --build --force-recreate api && docker-compose logs -f --tail=32 api

### mongo:

    docker exec -it questland_mongo_1 mongo admin
        db.createUser({ user:"root", pwd:"ofvi8h8gASvihnf9g8h", roles:[{role:"userAdminAnyDatabase",db:"admin"},{role:"clusterAdmin",db:"admin"},{role:"readAnyDatabase",db:"admin"}] })
        exit

    docker exec -it questland_mongo_1 mongo -u root -p ofvi8h8gASvihnf9g8h admin
        use reforge
        db.createUser({ user:"reforge", pwd:"d0s9hf5SDJgDH83585", roles:["readWrite"] })
        exit

    docker exec -it questland_mongo_1 mongo -u reforge -p d0s9hf5SDJgDH83585 reforge
        show collections
        db.users.ensureIndex({ userId:1 }, { unique:true })
        exit

### update:

    cd ~/projects/questland/api && node uglifier.run.js && lol upd && ssh eki@b1.eki.one 'cd questland/api && git pull && yarn'

### clone prod data to local

    ssh root@b1.eki.one 'docker exec questland_mongo_1 mongodump --verbose --out /data/db --uri "mongodb://reforge:d0s9hf5SDJgDH83585@localhost:27017/reforge" && cd /home/eki/questland/api/docker/volumes/mongo-data && tar -zcvf reforge.tar.gz reforge'

    scp root@b1.eki.one:/home/eki/questland/api/docker/volumes/mongo-data/reforge.tar.gz ~/projects/questland/api/docker/volumes/mongo-data

    ssh root@b1.eki.one 'rm -rf /home/eki/questland/api/docker/volumes/mongo-data/reforge*'

    cd ~/projects/questland/api/docker/volumes/mongo-data && tar -xvf reforge.tar.gz

    docker exec questland_mongo_1 mongorestore -v -u reforge -p d0s9hf5SDJgDH83585 --db reforge /data/db/reforge

    rm -rf ~/projects/questland/api/docker/volumes/mongo-data/reforge*

### clone prod data to local (arch)

    ssh root@b1.eki.one 'docker exec questland_mongo_1 mongodump --verbose --out /data/db --uri "mongodb://reforge:d0s9hf5SDJgDH83585@localhost:27017/reforge" && cd /home/eki/questland/api/docker/volumes/mongo-data && tar -zcvf reforge.tar.gz reforge'

    scp root@b1.eki.one:/home/eki/questland/api/docker/volumes/mongo-data/reforge.tar.gz ~/projects/questland/api/docker/volumes

    ssh root@b1.eki.one 'rm -rf /home/eki/questland/api/docker/volumes/mongo-data/reforge*'

    # cd /home/j/projects/questland/api/docker/volumes && mv reforge.tar.gz mongo-data && cd mongo-data && tar -xvf reforge.tar.gz

    docker exec questland_mongo_1 mongorestore -v -u reforge -p d0s9hf5SDJgDH83585 --db reforge /data/db/reforge

    # rm -rf /home/j/projects/questland/api/docker/volumes/mongo-data/reforge*

# Questland

    Hi! I coordinate our team this week.
    Check out our tactic page: questland.net/tactic
    Also check team score here: questland.net/teams
