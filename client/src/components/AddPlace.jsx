import { Link, useParams } from "react-router-dom";
import { GoPlus } from "react-icons/go";
import { useEffect, useState } from "react";
import axios from "axios";
import AccountPage from "../pages/AccountPage";
import Image from "../common/Image";
import LoadingPage from "../pages/LoadingPage";

export default function AddPlace() {
  const [placeFind, setplaceFind] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/placeFind").then(({ data }) => {
      setplaceFind(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {loading ? (
        <LoadingPage />
      ) : (
        <div className="flex flex-col grow">
          <div
            key={placeFind._id}
            className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {placeFind.length > 0 &&
              placeFind.map((acc) => (
                <>
                  {acc.photos[0] && (
                    <Link
                      key={acc.id}
                      to={`admin/${acc._id}`}
                      className="flex flex-col gap-3"
                    >
                      <Image
                        src={acc.photos[0]}
                        alt="plcImg"
                        className="aspect-square object-cover rounded-2xl"
                      />
                      <div className="flex flex-row gap-10 justify-between items-center">
                        <div className="flex flex-col truncate gap-1">
                          <h2 className="text-lg tracking-wide font-bold truncate ">
                            {acc.title}
                          </h2>
                          <h2 className="font-medium tracking-wider text-gray-400">
                            {acc.city}, {acc.country}
                          </h2>
                        </div>
                        <h2 className="font-semibold text-primary">
                          &#8377;{acc.price}
                        </h2>
                      </div>
                    </Link>
                  )}
                </>
              ))}
          </div>
          <div className="flex flex-col grow items-end justify-end sticky bottom-0 pb-4   md:pb-8 md:pr-8">
            <Link
              to={"/account/accommodations/new"}
              className="flex flex-row-reverse flex-row bg-white w-fit items-center justify-center p-2 px-2 sm:px-4 gap-3 border-2 sm:p-2 rounded-full cursor-pointer font-semibold  hover:border-primary hover:bg-primary hover:text-white"
            >
              <GoPlus className="text-sm sm:text-3xl" />
              <button className="text-sm sm:text-base tracking-wide font-semibold ">
                Add New Place
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
