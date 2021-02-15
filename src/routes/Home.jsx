import React, { useEffect, useState } from 'react';
import {v4 as uuidv4} from 'uuid';
import { dbService, storageService } from 'fbase';
import Tweet from 'components/Tweet';

const Home = ({ userObj }) => {
    const [tweet, setTweet] = useState('');
    const [tweets, setTweets] = useState([]);
    const [attachment, setAttachment] = useState('');

    useEffect(() => {
        const unsubscribe = dbService.collection('tweets')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const tweetArray = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTweets(tweetArray);
            });

        return () => unsubscribe();
    }, []);

    const onSubmit = async (event) => {
        event.preventDefault();

        let attachmentUrl = '';

        if (attachment !== '') {
            const attachmentRef = storageService.ref().child(`${userObj.uid}/${uuidv4()}`);
            const response = await attachmentRef.putString(attachment, 'data_url');
            attachmentUrl = await response.ref.getDownloadURL();
        }

        const tweetObj = {
            text: tweet,
            createdAt: Date.now(),
            creatorId: userObj.uid,
            attachmentUrl,
        };
        await dbService.collection("tweets").add(tweetObj);

        setTweet('');
        setAttachment('');
    }

    const onChange = (event) => {
        const { target: { value } } = event;
        setTweet(value);
    }

    const onFileChange = (event) => {
        const { target: { files } } = event;

        const theFile = files[0];
        const reader = new FileReader();
        reader.onloadend = (finishedEvent) => {
            const { currentTarget: { result } } = finishedEvent;
            setAttachment(result);
        }
        reader.readAsDataURL(theFile);
    }

    const onClearAttachment = () => setAttachment(null);

    return (
        <div>
            <form onSubmit={onSubmit}>
                <input
                    type="text"
                    placeholder="What's on your mind?"
                    maxLength={120}
                    value={tweet}
                    onChange={onChange}
                />
                <input type="file" accept="image/*" onChange={onFileChange} />
                <input type="submit" value="Tweet"/>
                {attachment && (
                    <div>
                        <img src={attachment} width="50px" height="50px" alt="preview" />
                        <button onClick={onClearAttachment}>Clear</button>
                    </div>
                )}
            </form>
            <div>
                {tweets.map((doc) => (
                    <Tweet
                        key={doc.id}
                        tweetObj={doc}
                        isOwner={doc.creatorId === userObj.uid}
                    />
                ))}
            </div>
        </div>
    )
};

export default Home;