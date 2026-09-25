import {MongoClient} from 'mongodb';
const uri=process.env.MONGODB_URI; let promise;
export async function getDb(){if(!uri) throw new Error('MONGODB_URI is not configured'); if(!globalThis._pmMongo){globalThis._pmMongo=new MongoClient(uri).connect()} const c=await globalThis._pmMongo; return c.db(process.env.MONGODB_DB||'prep-master')}
