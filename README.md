# what?

I'm working with some fairly verbose hubdb tables and I needed a more efficent way of working with the data/exporting data.

This simply creates a SQLlite table from your data and allows you to query it via the cli.

Currently it exports all tables from your portal. If you have PII be careful and make sure you cleanup/dont use this tool.

1. create a .env file based on .env.example with your API key
2. run the intial setup (pulls all hubdb tables down, so try not to do this yet if you have PII in your hubdb tables)

```
$ node index.js setup
```

3. query until your heart is content

```
node index.js "SELECT * FROM table WHERE hs_id=x"
```

4. you can export to CSV, or JSON too:

```
node index.js "SELECT * FROM table WHERE status in ("x", "x")" --output=csv > rows.csv
```

```
node index.js "SELECT * FROM table WHERE status in ("x", "x")" --output=json > rows.json
```

5. enjoy sql past-times with joins:

```
node index.js "SELECT * FROM table1 INNER JOIN table2 ON (table1.x = table2.x)"

```

## things i may do:

1. support more hubdb row formats (currently it's only simple formats, TEXT and NUMBER)
2. cleanup code
3. work with in memory sqllite
4.
5.
6.
7.
8.
9.
10. maybe allow writes?
11.
12.
13.
14.
15.
16.
17.
18.
19. ~20. be a good developer and write tests
