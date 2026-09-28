import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import type { UserDoc } from '@/types';

export const userConverter: FirestoreDataConverter<UserDoc> = {
  toFirestore: (user) => user,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as UserDoc,
};
